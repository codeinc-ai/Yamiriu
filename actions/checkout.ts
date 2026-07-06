"use server";

import { headers } from "next/headers";
import { and, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  addresses,
  discounts,
  giftCards,
  productVariants,
  products,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { placeOrderSchema } from "@/lib/validations";
import { validateDiscountRules, computeDiscountAmount } from "@/lib/discount-rules";
import { calculateShipping, COD_MAX_ORDER_VALUE } from "@/lib/checkout-config";
import { getPaymentService, type PaymentOrderContext, type RedirectFormSpec } from "@/lib/payments";
import { writeAuditLog } from "@/lib/audit";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { cancelAndRestockOrder } from "@/lib/orders/cancel-and-restock";
import { notifyOrderConfirmed, notifyCodConfirmationRequest } from "@/lib/notifications/dispatch";

export interface PlaceOrderResult {
  ok: boolean;
  error?: string;
  orderNumber?: string;
  /** Set for cod/bank_transfer — navigate straight to the confirmation page. */
  redirectUrl?: string;
  /** Set for jazzcash/easypaisa/card — the browser must auto-submit this
   * form to the provider's hosted checkout page. */
  redirectForm?: RedirectFormSpec;
}

// A COD customer/phone with this many prior refused/undelivered COD orders is
// held for manual review instead of auto-confirmed (S-029).
const COD_FRAUD_THRESHOLD = 2;

class StockConflictError extends Error {}
class DiscountConflictError extends Error {}
class GiftCardConflictError extends Error {}

export async function placeOrder(rawInput: unknown): Promise<PlaceOrderResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("checkout", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = placeOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const input = parsed.data;

  const user = await getCurrentUser();
  if (!user && !input.guestEmail) {
    return { ok: false, error: "Enter an email address for your order." };
  }

  // ---------------------------------------------------------------------
  // Resolve shipping address (saved address book selection or manual entry)
  // ---------------------------------------------------------------------
  let shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    province?: string | null;
    postalCode?: string | null;
  };

  if (input.addressId) {
    if (!user) {
      return { ok: false, error: "Sign in to use a saved address." };
    }
    const saved = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, input.addressId),
        eq(addresses.userId, user.id),
        isNull(addresses.deletedAt)
      ),
    });
    if (!saved) {
      return { ok: false, error: "That address could not be found." };
    }
    shippingAddress = saved;
  } else if (input.address) {
    shippingAddress = input.address;
  } else {
    return { ok: false, error: "Provide a shipping address." };
  }

  let customerEmail: string;
  if (user) {
    const userRow = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!userRow) {
      return { ok: false, error: "Your account could not be found. Please sign in again." };
    }
    // Banned accounts can't place new orders (PRD 4.8.4).
    if (!userRow.isActive) {
      return { ok: false, error: "This account is not able to place orders. Contact support for help." };
    }
    customerEmail = userRow.email;
  } else {
    customerEmail = input.guestEmail!;
  }
  const customerPhone = shippingAddress.phone;

  // ---------------------------------------------------------------------
  // Live price/stock snapshot — cheap pre-check for a fast UX error; the
  // authoritative check is the atomic UPDATE inside the transaction below.
  // ---------------------------------------------------------------------
  const variantIds = input.items.map((item) => item.variantId);
  const liveRows = await db
    .select({
      variantId: productVariants.id,
      stock: productVariants.stock,
      price: products.price,
      productName: products.name,
      variantDeletedAt: productVariants.deletedAt,
      published: products.published,
      productDeletedAt: products.deletedAt,
      size: productVariants.size,
      color: productVariants.color,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const liveByVariantId = new Map(liveRows.map((row) => [row.variantId, row]));

  for (const item of input.items) {
    const live = liveByVariantId.get(item.variantId);
    const available = live && live.published && !live.variantDeletedAt && !live.productDeletedAt;
    if (!available) {
      return { ok: false, error: "One or more items in your cart are no longer available." };
    }
    if (live!.stock < item.quantity) {
      return {
        ok: false,
        error: `Only ${live!.stock} of "${live!.productName}" left in stock.`,
      };
    }
  }

  const subtotal = input.items.reduce((sum, item) => {
    const live = liveByVariantId.get(item.variantId)!;
    return sum + Number(live.price) * item.quantity;
  }, 0);

  // ---------------------------------------------------------------------
  // Discount re-validation (never trust the client-computed amount)
  // ---------------------------------------------------------------------
  let discountRow: typeof discounts.$inferSelect | null = null;
  let discountAmount = 0;
  const discountCode = input.discountCode?.trim().toUpperCase();
  if (discountCode) {
    const row = await db.query.discounts.findFirst({
      where: and(eq(discounts.code, discountCode), isNull(discounts.deletedAt)),
    });
    if (!row) {
      return { ok: false, error: "This discount code isn't valid." };
    }
    const validation = validateDiscountRules(row, subtotal);
    if (!validation.valid) {
      return { ok: false, error: validation.error };
    }
    discountRow = row;
    discountAmount = computeDiscountAmount(row, subtotal);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingCost = calculateShipping(discountedSubtotal);
  const preGiftCardTotal = discountedSubtotal + shippingCost;

  // ---------------------------------------------------------------------
  // Gift card re-validation (payment-reducing credit, never trust the
  // client-computed amount) — applied against the post-discount total
  // including shipping.
  // ---------------------------------------------------------------------
  let giftCardRow: typeof giftCards.$inferSelect | null = null;
  let giftCardAmount = 0;
  const giftCardCode = input.giftCardCode?.trim().toUpperCase();
  if (giftCardCode) {
    const row = await db.query.giftCards.findFirst({
      where: and(eq(giftCards.code, giftCardCode), isNull(giftCards.deletedAt)),
    });
    if (!row || !row.active) {
      return { ok: false, error: "This gift card isn't valid." };
    }
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: "This gift card has expired." };
    }
    if (Number(row.balance) <= 0) {
      return { ok: false, error: "This gift card has no remaining balance." };
    }
    giftCardRow = row;
    giftCardAmount = Math.min(Number(row.balance), preGiftCardTotal);
  }

  const total = Math.max(0, preGiftCardTotal - giftCardAmount);

  if (input.paymentMethod === "cod" && total > COD_MAX_ORDER_VALUE) {
    return {
      ok: false,
      error: "Cash on Delivery isn't available for orders over this value. Please choose another payment method.",
    };
  }

  // ---------------------------------------------------------------------
  // COD fraud check (S-029)
  // ---------------------------------------------------------------------
  let initialStatus: "confirmed" | "pending_review" | "pending_payment";
  if (input.paymentMethod === "cod") {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.codRefused, true),
          user
            ? or(eq(orders.customerPhone, customerPhone), eq(orders.userId, user.id))
            : eq(orders.customerPhone, customerPhone)
        )
      );
    initialStatus = count >= COD_FRAUD_THRESHOLD ? "pending_review" : "confirmed";
  } else {
    initialStatus = "pending_payment";
  }

  // ---------------------------------------------------------------------
  // Transaction: atomic stock decrement (FR-010) + discount consumption +
  // order/order_items insert
  // ---------------------------------------------------------------------
  let orderId: string;
  let orderNumber: string;
  try {
    const result = await db.transaction(async (tx) => {
      for (const item of input.items) {
        const [updated] = await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
          .where(
            and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity))
          )
          .returning();
        if (!updated) throw new StockConflictError();
      }

      if (discountRow) {
        const [updatedDiscount] = await tx
          .update(discounts)
          .set({ usedCount: sql`${discounts.usedCount} + 1` })
          .where(
            and(
              eq(discounts.id, discountRow.id),
              or(isNull(discounts.usageLimit), lt(discounts.usedCount, discounts.usageLimit))
            )
          )
          .returning();
        if (!updatedDiscount) throw new DiscountConflictError();
      }

      if (giftCardRow) {
        const [updatedGiftCard] = await tx
          .update(giftCards)
          .set({ balance: sql`${giftCards.balance} - ${giftCardAmount}` })
          .where(and(eq(giftCards.id, giftCardRow.id), gte(giftCards.balance, giftCardAmount.toFixed(2))))
          .returning();
        if (!updatedGiftCard) throw new GiftCardConflictError();
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: user?.id,
          guestEmail: user ? undefined : customerEmail,
          status: initialStatus,
          paymentMethod: input.paymentMethod,
          subtotal: subtotal.toFixed(2),
          discountCode: discountRow?.code,
          discountAmount: discountAmount.toFixed(2),
          giftCardCode: giftCardRow?.code,
          giftCardAmount: giftCardAmount.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          total: total.toFixed(2),
          shippingAddress,
          customerPhone,
        })
        .returning();

      await tx.insert(orderItems).values(
        input.items.map((item) => ({
          orderId: order.id,
          productVariantId: item.variantId,
          quantity: item.quantity,
          priceAtPurchase: liveByVariantId.get(item.variantId)!.price,
          outfitGroupId: item.outfitGroupId,
        }))
      );

      if (user && input.saveAddress && input.address) {
        await tx.insert(addresses).values({ userId: user.id, ...input.address });
      }

      return order;
    });
    orderId = result.id;
    orderNumber = result.orderNumber;
  } catch (error) {
    if (error instanceof StockConflictError) {
      return {
        ok: false,
        error: "Sorry, one or more items just sold out. Please review your cart.",
      };
    }
    if (error instanceof DiscountConflictError) {
      return { ok: false, error: "This discount code just reached its usage limit." };
    }
    if (error instanceof GiftCardConflictError) {
      return { ok: false, error: "This gift card's balance just changed. Please try again." };
    }
    throw error;
  }

  // ---------------------------------------------------------------------
  // Post-commit: payment stub, confirmation email, audit log — best effort,
  // never roll back the already-committed order.
  // ---------------------------------------------------------------------
  const paymentContext: PaymentOrderContext = {
    orderId,
    orderNumber,
    amount: total,
    customerEmail,
    customerPhone,
  };

  let paymentResult;
  try {
    paymentResult = await getPaymentService(input.paymentMethod).initiatePayment(paymentContext);
  } catch (error) {
    console.error("[checkout] failed to initiate payment; rolling back order", orderNumber, error);
    await cancelAndRestockOrder(orderId);
    return {
      ok: false,
      error: "This payment method isn't available right now. Please choose another payment method.",
    };
  }

  await writeAuditLog({
    actorUserId: user?.id ?? null,
    action: "order.created",
    targetType: "order",
    targetId: orderId,
    metadata: { orderNumber, paymentMethod: input.paymentMethod, status: initialStatus },
  });

  try {
    await sendOrderConfirmationEmail(customerEmail, {
      orderNumber,
      status: initialStatus === "confirmed" ? "confirmed" : initialStatus,
      paymentMethod: input.paymentMethod,
      items: input.items.map((item) => {
        const live = liveByVariantId.get(item.variantId)!;
        return {
          name: live.productName,
          size: live.size,
          color: live.color,
          quantity: item.quantity,
          priceAtPurchase: live.price,
        };
      }),
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2),
      shippingAddress,
    });
  } catch (error) {
    console.error("[checkout] failed to send order confirmation email", error);
  }

  if (initialStatus === "confirmed") {
    await notifyOrderConfirmed(orderId);
  }
  if (input.paymentMethod === "cod") {
    await notifyCodConfirmationRequest(orderId);
  }

  if (paymentResult.outcome === "redirect_form" && paymentResult.redirectForm) {
    return { ok: true, orderNumber, redirectForm: paymentResult.redirectForm };
  }
  return { ok: true, orderNumber, redirectUrl: `/checkout/confirmation/${orderNumber}` };
}

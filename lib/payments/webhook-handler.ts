import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products, users, type paymentProviderEnum } from "@/db/schema";
import { getPaymentService, claimWebhookEvent, type PaymentMethod } from "@/lib/payments";
import { writeAuditLog } from "@/lib/audit";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { reportError } from "@/lib/report-error";
import { cancelAndRestockOrder } from "@/lib/orders/cancel-and-restock";
import { notifyOrderConfirmed } from "@/lib/notifications/dispatch";

type PaymentProvider = (typeof paymentProviderEnum.enumValues)[number];

export interface WebhookProcessResult {
  httpStatus: number;
  body: Record<string, unknown>;
}

/** JazzCash/Easypaisa/PayFast all POST form-encoded bodies; support JSON too
 * since exact content-type conventions can't be confirmed without live
 * sandbox access (see PAYMENTS_TESTING.md). */
export async function parseWebhookBody(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, string>;
  }
  const formData = await request.formData();
  const body: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    body[key] = String(value);
  }
  return body;
}

/**
 * Shared webhook orchestration for all three payment providers (S-017):
 * verify the signature (via the provider's own handleWebhook), dedupe via
 * webhook_events so a duplicate delivery never double-confirms an order,
 * transition pending_payment -> confirmed or cancelled+restocked, then
 * trigger the confirmation email + audit log on success. Never logs the raw
 * payload (S-023) — only order numbers / event ids / response codes.
 */
export async function processPaymentWebhook(
  method: PaymentMethod,
  provider: PaymentProvider,
  payload: unknown,
  signature: string | null
): Promise<WebhookProcessResult> {
  const result = await getPaymentService(method).handleWebhook(payload, signature);

  if (!result.valid || !result.orderNumber) {
    reportError(new Error(result.message ?? "Webhook signature verification failed"), { provider });
    return { httpStatus: 401, body: { error: "Invalid signature." } };
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, result.orderNumber) });
  if (!order) {
    reportError(new Error("Webhook referenced an unknown order"), {
      provider,
      orderNumber: result.orderNumber,
    });
    return { httpStatus: 404, body: { error: "Order not found." } };
  }

  const eventId = result.providerEventId ?? `${result.orderNumber}:${result.status ?? "unknown"}`;
  const claimed = await claimWebhookEvent(provider, eventId, order.id);
  if (!claimed) {
    return { httpStatus: 200, body: { ok: true, duplicate: true } };
  }

  // Already resolved by a prior delivery (under a different event id) or a
  // manual admin action — never reprocess a non-pending order.
  if (order.status !== "pending_payment") {
    return { httpStatus: 200, body: { ok: true, alreadyProcessed: true } };
  }

  try {
    if (result.status === "paid") {
      await db
        .update(orders)
        .set({ status: "confirmed", providerTransactionId: result.providerTransactionId ?? null })
        .where(eq(orders.id, order.id));

      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: order.id,
        metadata: { orderNumber: order.orderNumber, from: "pending_payment", to: "confirmed", provider },
      });

      await sendConfirmationEmail(order.id);
      await notifyOrderConfirmed(order.id);
    } else {
      await cancelAndRestockOrder(order.id);

      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          from: "pending_payment",
          to: "cancelled",
          provider,
          reason: "payment_declined",
        },
      });
    }
  } catch (error) {
    reportError(error, { provider, orderNumber: order.orderNumber, stage: "webhook_processing" });
    return { httpStatus: 500, body: { error: "Failed to process webhook." } };
  }

  return { httpStatus: 200, body: { ok: true } };
}

async function sendConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    let customerEmail = order.guestEmail;
    if (!customerEmail && order.userId) {
      const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
      customerEmail = user?.email ?? null;
    }
    if (!customerEmail) return;

    const items = await db
      .select({
        productName: products.name,
        size: productVariants.size,
        color: productVariants.color,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    await sendOrderConfirmationEmail(customerEmail, {
      orderNumber: order.orderNumber,
      status: "confirmed",
      paymentMethod: order.paymentMethod,
      items: items.map((item) => ({
        name: item.productName,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingCost: order.shippingCost,
      total: order.total,
      shippingAddress: order.shippingAddress as {
        fullName: string;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        province?: string | null;
      },
    });
  } catch (error) {
    reportError(error, { stage: "confirmation_email", orderId });
  }
}

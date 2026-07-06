"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, productVariants, products } from "@/db/schema";
import { withAuth } from "@/lib/auth-guards";
import { requirePermission } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";
import { cancelAndRestockOrder } from "@/lib/orders/cancel-and-restock";
import { notifyOrderShipped, notifyOrderDelivered, notifyOrderConfirmed } from "@/lib/notifications/dispatch";
import { getCourierService, ACTIVE_COURIER_PROVIDER } from "@/lib/courier";
import { reportError } from "@/lib/report-error";
import { ALLOWED_ORDER_TRANSITIONS, MONEY_MOVEMENT_TARGETS } from "@/lib/order-transitions";

export interface AdminOrderActionResult {
  ok: boolean;
  error?: string;
}

export const transitionOrderStatus = withAuth(
  async (
    actor,
    input: { orderId: string; targetStatus: string }
  ): Promise<AdminOrderActionResult> => {
    const permission = MONEY_MOVEMENT_TARGETS.has(input.targetStatus) ? "orders:refund" : "orders:write";
    requirePermission(actor, permission);

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, input.orderId), isNull(orders.deletedAt)),
    });
    if (!order) return { ok: false, error: "Order not found." };

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(input.targetStatus)) {
      return { ok: false, error: `Can't move an order from "${order.status}" to "${input.targetStatus}".` };
    }

    if (input.targetStatus === "cancelled" || input.targetStatus === "refunded") {
      await cancelAndRestockOrder(order.id, input.targetStatus);
    } else {
      await db.update(orders).set({ status: input.targetStatus as typeof order.status }).where(eq(orders.id, order.id));
    }

    await writeAuditLog({
      actorUserId: actor.id,
      action: input.targetStatus === "refunded" ? "order.refunded" : "order.status_changed",
      targetType: "order",
      targetId: order.id,
      metadata: { orderNumber: order.orderNumber, from: order.status, to: input.targetStatus },
    });

    if (input.targetStatus === "shipped") {
      await notifyOrderShipped(order.id);
    } else if (input.targetStatus === "delivered") {
      await notifyOrderDelivered(order.id);
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.orderNumber}`);
    return { ok: true };
  }
);

export const confirmBankTransferPayment = withAuth(
  async (actor, orderId: string): Promise<AdminOrderActionResult> => {
    requirePermission(actor, "orders:write");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    });
    if (!order) return { ok: false, error: "Order not found." };
    if (order.paymentMethod !== "bank_transfer" || order.status !== "pending_payment") {
      return { ok: false, error: "This order isn't awaiting a bank transfer confirmation." };
    }

    await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, orderId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "order.status_changed",
      targetType: "order",
      targetId: orderId,
      metadata: { orderNumber: order.orderNumber, from: "pending_payment", to: "confirmed", reason: "manual_bank_transfer_confirmation" },
    });

    await notifyOrderConfirmed(orderId);

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.orderNumber}`);
    return { ok: true };
  }
);

export const generateShipment = withAuth(
  async (actor, orderId: string): Promise<AdminOrderActionResult> => {
    requirePermission(actor, "orders:write");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    });
    if (!order) return { ok: false, error: "Order not found." };
    if (order.status !== "processing") {
      return { ok: false, error: "Only orders in processing can be handed off to the courier." };
    }
    if (order.trackingNumber) {
      return { ok: false, error: "This order already has a tracking number." };
    }

    const items = await db
      .select({ name: products.name, quantity: orderItems.quantity })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    const address = order.shippingAddress as {
      fullName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
    };

    try {
      const result = await getCourierService().createShipment({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: address.fullName,
        customerPhone: order.customerPhone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        codAmount: order.paymentMethod === "cod" ? Number(order.total) : 0,
        items,
      });

      await db
        .update(orders)
        .set({ trackingNumber: result.trackingNumber, courierProvider: ACTIVE_COURIER_PROVIDER })
        .where(eq(orders.id, orderId));

      await writeAuditLog({
        actorUserId: actor.id,
        action: "order.shipment_created",
        targetType: "order",
        targetId: orderId,
        metadata: { orderNumber: order.orderNumber, provider: ACTIVE_COURIER_PROVIDER },
      });

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${order.orderNumber}`);
      return { ok: true };
    } catch (error) {
      reportError(error, { stage: "generate_shipment", orderId });
      return { ok: false, error: "Couldn't create the courier shipment. Please try again." };
    }
  }
);

/** COD reconciliation (S-029): approve confirms the held order; reject
 * cancels + restocks it and marks codRefused so it counts toward this
 * customer's future risk score (see actions/checkout.ts's fraud check). */
export const approveCodOrder = withAuth(
  async (actor, orderId: string): Promise<AdminOrderActionResult> => {
    requirePermission(actor, "orders:write");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    });
    if (!order || order.status !== "pending_review") {
      return { ok: false, error: "This order isn't awaiting COD review." };
    }

    await db.update(orders).set({ status: "confirmed" }).where(eq(orders.id, orderId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "order.status_changed",
      targetType: "order",
      targetId: orderId,
      metadata: { orderNumber: order.orderNumber, from: "pending_review", to: "confirmed", reason: "cod_reconciliation_approved" },
    });

    await notifyOrderConfirmed(orderId);

    revalidatePath("/admin/orders");
    return { ok: true };
  }
);

export const rejectCodOrder = withAuth(
  async (actor, orderId: string): Promise<AdminOrderActionResult> => {
    requirePermission(actor, "orders:write");

    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), isNull(orders.deletedAt)),
    });
    if (!order || order.status !== "pending_review") {
      return { ok: false, error: "This order isn't awaiting COD review." };
    }

    await db.update(orders).set({ codRefused: true }).where(eq(orders.id, orderId));
    await cancelAndRestockOrder(orderId, "cancelled");

    await writeAuditLog({
      actorUserId: actor.id,
      action: "order.status_changed",
      targetType: "order",
      targetId: orderId,
      metadata: { orderNumber: order.orderNumber, from: "pending_review", to: "cancelled", reason: "cod_reconciliation_rejected" },
    });

    revalidatePath("/admin/orders");
    return { ok: true };
  }
);

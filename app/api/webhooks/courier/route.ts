import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getCourierService, ACTIVE_COURIER_PROVIDER, claimCourierWebhookEvent } from "@/lib/courier";
import { cancelAndRestockOrder } from "@/lib/orders/cancel-and-restock";
import { notifyOrderShipped, notifyOrderDelivered } from "@/lib/notifications/dispatch";
import { writeAuditLog } from "@/lib/audit";
import { reportError } from "@/lib/report-error";

/**
 * Courier delivery-status webhook (PRD 4.8.6, S-017). PostEx doesn't publish
 * a signature scheme, so this is secured via a shared-secret header (see
 * lib/courier/postex.ts's handleWebhook) — the same fail-closed posture as
 * the internal cron endpoint. Idempotent via courier_webhook_events.
 */
export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const signature = request.headers.get("x-webhook-secret");

  const result = await getCourierService().handleWebhook(payload, signature);
  if (!result.valid || !result.trackingNumber || !result.status) {
    reportError(new Error(result.message ?? "Courier webhook verification failed"), {
      provider: ACTIVE_COURIER_PROVIDER,
    });
    return NextResponse.json({ error: "Invalid webhook." }, { status: 401 });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.trackingNumber, result.trackingNumber),
  });
  if (!order) {
    reportError(new Error("Courier webhook referenced an unknown tracking number"), {
      provider: ACTIVE_COURIER_PROVIDER,
    });
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const eventId = result.providerEventId ?? `${result.trackingNumber}:${result.status}`;
  const claimed = await claimCourierWebhookEvent(ACTIVE_COURIER_PROVIDER, eventId, order.id);
  if (!claimed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    if (result.status === "picked_up" && order.status === "processing") {
      await db.update(orders).set({ status: "shipped" }).where(eq(orders.id, order.id));
      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: order.id,
        metadata: { orderNumber: order.orderNumber, from: "processing", to: "shipped", provider: ACTIVE_COURIER_PROVIDER },
      });
      await notifyOrderShipped(order.id);
    } else if (result.status === "delivered" && order.status !== "delivered") {
      await db.update(orders).set({ status: "delivered" }).where(eq(orders.id, order.id));
      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: order.id,
        metadata: { orderNumber: order.orderNumber, from: order.status, to: "delivered", provider: ACTIVE_COURIER_PROVIDER },
      });
      await notifyOrderDelivered(order.id);
    } else if (
      (result.status === "returned" || result.status === "failed") &&
      order.status !== "cancelled" &&
      order.status !== "refunded"
    ) {
      await cancelAndRestockOrder(order.id, "cancelled");
      // A returned/failed COD delivery is exactly the risk signal the COD
      // fraud check (S-029) counts toward for this customer's future orders.
      if (order.paymentMethod === "cod") {
        await db.update(orders).set({ codRefused: true }).where(eq(orders.id, order.id));
      }
      await writeAuditLog({
        action: "order.status_changed",
        targetType: "order",
        targetId: order.id,
        metadata: { orderNumber: order.orderNumber, from: order.status, to: "cancelled", provider: ACTIVE_COURIER_PROVIDER, reason: result.status },
      });
    }
  } catch (error) {
    reportError(error, { provider: ACTIVE_COURIER_PROVIDER, orderNumber: order.orderNumber, stage: "courier_webhook_processing" });
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

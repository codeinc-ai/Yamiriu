import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { getCourierTrackingUrl } from "@/lib/courier/tracking-urls";
import { sendOrderShippedEmail } from "@/lib/email";
import { reportError } from "@/lib/report-error";
import { whatsAppService } from "@/lib/whatsapp";
import {
  orderConfirmationTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
  codConfirmationTemplate,
} from "@/lib/whatsapp/templates";
import { getSmsService } from "@/lib/sms";
import { formatPkr } from "@/lib/format";

/**
 * Central order-lifecycle notification dispatch (PRD 2.5, Batch 4). Each
 * function here is the single place that decides "who gets notified, on
 * which channels, with what content" for one order-status milestone —
 * called from the admin status-transition action, the courier webhook, and
 * checkout. WhatsApp is the primary channel; SMS is the fallback used only
 * when WhatsApp is unavailable or the send itself fails, never both at
 * once. All sends are best-effort (never block or fail the caller) and
 * never log PII (S-023) — only order numbers, never phone numbers/names/
 * addresses.
 */

async function dispatchToCustomer(
  phone: string,
  whatsapp: Parameters<typeof whatsAppService.sendTemplate>[1],
  smsMessage: string
): Promise<void> {
  const waResult = await whatsAppService.sendTemplate(phone, whatsapp);
  if (!waResult.ok) {
    await getSmsService().sendSms(phone, smsMessage);
  }
}

async function resolveCustomerEmail(order: { guestEmail: string | null; userId: string | null }): Promise<string | null> {
  if (order.guestEmail) return order.guestEmail;
  if (!order.userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, order.userId) });
  return user?.email ?? null;
}

export async function notifyOrderConfirmed(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    const email = await resolveCustomerEmail(order);
    const customerName = order.shippingAddress && typeof order.shippingAddress === "object" && "fullName" in order.shippingAddress
      ? String((order.shippingAddress as { fullName?: string }).fullName ?? "")
      : "";

    await dispatchToCustomer(
      order.customerPhone,
      orderConfirmationTemplate({ customerName, orderNumber: order.orderNumber, totalFormatted: formatPkr(order.total) }),
      `Yamiriu: order ${order.orderNumber} confirmed — total ${formatPkr(order.total)}.`
    );

    void email; // email confirmation is already sent separately from actions/checkout.ts
  } catch (error) {
    reportError(error, { stage: "order_confirmed_notification", orderId });
  }
}

export async function notifyCodConfirmationRequest(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order || order.paymentMethod !== "cod") return;

    const customerName = order.shippingAddress && typeof order.shippingAddress === "object" && "fullName" in order.shippingAddress
      ? String((order.shippingAddress as { fullName?: string }).fullName ?? "")
      : "";

    await dispatchToCustomer(
      order.customerPhone,
      codConfirmationTemplate({ customerName, orderNumber: order.orderNumber, totalFormatted: formatPkr(order.total) }),
      `Yamiriu: please confirm your Cash on Delivery order ${order.orderNumber} for ${formatPkr(order.total)}. Reply YES to confirm.`
    );
  } catch (error) {
    reportError(error, { stage: "cod_confirmation_notification", orderId });
  }
}

/** Shared by the admin "mark shipped" action and the courier webhook's
 * picked-up event — both are valid triggers for the shipped notification. */
export async function notifyOrderShipped(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order || !order.trackingNumber) return;

    const email = await resolveCustomerEmail(order);
    const trackingUrl = getCourierTrackingUrl(order.courierProvider, order.trackingNumber);

    if (email) {
      await sendOrderShippedEmail(email, {
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        trackingUrl,
        courierProvider: order.courierProvider,
      });
    }

    await dispatchToCustomer(
      order.customerPhone,
      orderShippedTemplate({ orderNumber: order.orderNumber, trackingNumber: order.trackingNumber }),
      `Yamiriu: order ${order.orderNumber} has shipped. Tracking: ${order.trackingNumber}${trackingUrl ? ` — ${trackingUrl}` : ""}`
    );
  } catch (error) {
    reportError(error, { stage: "order_shipped_notification", orderId });
  }
}

/** Triggered when an order reaches "delivered" — admin manual transition or
 * the courier webhook's delivered event. */
export async function notifyOrderDelivered(orderId: string): Promise<void> {
  try {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
    if (!order) return;

    await dispatchToCustomer(
      order.customerPhone,
      orderDeliveredTemplate({ orderNumber: order.orderNumber }),
      `Yamiriu: order ${order.orderNumber} has been delivered. Thank you for shopping with us!`
    );
  } catch (error) {
    reportError(error, { stage: "order_delivered_notification", orderId });
  }
}

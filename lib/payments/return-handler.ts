import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { parseWebhookBody } from "./webhook-handler";

/** Merges query-string params (GET-style returns) with a form/JSON body
 * (POST-style returns) — gateways vary in which they use for the browser
 * round trip, so both are supported. */
export async function parseReturnParams(request: Request): Promise<Record<string, string>> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  if (request.method === "POST") {
    try {
      Object.assign(params, await parseWebhookBody(request));
    } catch {
      // No parseable body — query params (if any) still apply.
    }
  }
  return params;
}

/**
 * Decides where to send the BROWSER after a hosted-checkout round trip.
 * This is UX only, never authoritative — processPaymentWebhook (server-to-
 * server) is the sole source of truth for actually confirming/cancelling an
 * order. If the webhook hasn't landed yet, `likelySuccess` (parsed from the
 * provider's own return fields) is used as a best-effort hint so the
 * customer isn't stuck on a blank screen while it catches up.
 */
export async function resolveReturnDestination(
  orderNumber: string | undefined,
  likelySuccess: boolean
): Promise<string> {
  if (!orderNumber) return "/checkout?paymentFailed=1";

  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, orderNumber) });
  if (!order) return "/checkout?paymentFailed=1";
  if (order.status === "confirmed") return `/checkout/confirmation/${orderNumber}`;
  if (order.status === "cancelled") return "/checkout?paymentFailed=1";
  return likelySuccess ? `/checkout/confirmation/${orderNumber}` : "/checkout?paymentFailed=1";
}

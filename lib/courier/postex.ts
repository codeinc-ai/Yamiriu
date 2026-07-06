import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";
import type {
  CourierService,
  ShipmentOrderContext,
  CreateShipmentResult,
  TrackingStatusResult,
  CourierWebhookResult,
} from "./types";

/**
 * PostEx (api.postex.pk) courier integration — chosen over Leopards Courier
 * after comparing public documentation: PostEx exposes a concrete, current
 * REST/JSON API (confirmed via a working reference client), while Leopards'
 * documentation is older, snake_case/array-param style, and neither publishes
 * a webhook signature scheme. See app/api/webhooks/courier/route.ts for how
 * that gap is handled (shared-secret header, same posture as the cron route).
 *
 * IMPORTANT: PostEx gates full merchant API docs behind account signup, so
 * this field list/response shape could not be byte-for-byte verified against
 * a live merchant account in this environment — verify against real
 * sandbox/production credentials before go-live (mirrors the JazzCash caveat
 * in lib/payments/jazzcash.ts).
 */

const POSTEX_BASE_URL = "https://api.postex.pk/services/integration/api/order";

function requireCredentials() {
  if (!env.COURIER_API_KEY || !env.COURIER_PICKUP_ADDRESS_CODE || !env.COURIER_STORE_ADDRESS_CODE) {
    throw new Error(
      "PostEx is not configured (COURIER_API_KEY / COURIER_PICKUP_ADDRESS_CODE / COURIER_STORE_ADDRESS_CODE)."
    );
  }
  return {
    token: env.COURIER_API_KEY,
    pickupAddressCode: env.COURIER_PICKUP_ADDRESS_CODE,
    storeAddressCode: env.COURIER_STORE_ADDRESS_CODE,
  };
}

interface PostExCreateOrderResponse {
  statusCode?: string;
  statusMessage?: string;
  dist?: {
    trackingNumber?: string;
    trackingResponse?: { trackingNumber?: string };
  };
}

export const postexCourierService: CourierService = {
  async createShipment(order: ShipmentOrderContext): Promise<CreateShipmentResult> {
    const { token, pickupAddressCode, storeAddressCode } = requireCredentials();

    const itemsSummary = order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
    const deliveryAddress = order.addressLine2
      ? `${order.addressLine1}, ${order.addressLine2}`
      : order.addressLine1;

    const response = await fetch(`${POSTEX_BASE_URL}/v3/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token },
      body: JSON.stringify({
        cityName: order.city,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress,
        invoiceDivision: order.city,
        invoicePayment: order.codAmount,
        items: order.items.length,
        orderDetail: itemsSummary || order.orderNumber,
        orderRefNumber: order.orderNumber,
        orderType: "Normal",
        transactionNotes: `Yamiriu order ${order.orderNumber}`,
        pickupAddressCode,
        storeAddressCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`PostEx create-order failed with status ${response.status}.`);
    }

    const data = (await response.json()) as PostExCreateOrderResponse;
    const trackingNumber = data.dist?.trackingNumber ?? data.dist?.trackingResponse?.trackingNumber;
    if (!trackingNumber) {
      throw new Error(data.statusMessage ?? "PostEx did not return a tracking number.");
    }

    return { trackingNumber, providerRef: trackingNumber };
  },

  async getTracking(trackingNumber: string): Promise<TrackingStatusResult> {
    const { token } = requireCredentials();

    const response = await fetch(
      `${POSTEX_BASE_URL}/v1/track-order/${encodeURIComponent(trackingNumber)}`,
      { headers: { token } }
    );
    if (!response.ok) {
      throw new Error(`PostEx track-order failed with status ${response.status}.`);
    }

    const data = (await response.json()) as {
      dist?: { transactionStatus?: string; transactionStatusHistory?: Array<{ transactionStatusMessageCode?: string; modifiedDatetime?: string }> };
    };

    return {
      status: data.dist?.transactionStatus ?? "unknown",
      events: (data.dist?.transactionStatusHistory ?? []).map((e) => ({
        status: e.transactionStatusMessageCode ?? "unknown",
        timestamp: e.modifiedDatetime,
      })),
    };
  },

  /**
   * PostEx does not publish a webhook signature scheme, so this endpoint is
   * instead secured via a shared secret configured out-of-band with the
   * courier/ops team (fail-closed if unconfigured), exactly like the
   * internal cron endpoint (app/api/cron/cancel-stale-orders).
   */
  async handleWebhook(payload: unknown, signature: string | null): Promise<CourierWebhookResult> {
    if (!env.COURIER_WEBHOOK_SECRET) {
      return { valid: false, message: "Courier webhook is not configured." };
    }
    const expected = Buffer.from(env.COURIER_WEBHOOK_SECRET);
    const received = Buffer.from(signature ?? "");
    const validSecret = expected.length === received.length && crypto.timingSafeEqual(expected, received);
    if (!validSecret) {
      return { valid: false, message: "Invalid webhook secret." };
    }

    if (typeof payload !== "object" || payload === null) {
      return { valid: false, message: "Malformed courier webhook payload." };
    }
    const body = payload as Record<string, string>;
    const trackingNumber = body.trackingNumber ?? body.cn;
    const rawStatus = (body.transactionStatus ?? body.status ?? "").toLowerCase();
    if (!trackingNumber || !rawStatus) {
      return { valid: false, message: "Missing tracking number or status." };
    }

    const statusMap: Record<string, CourierWebhookResult["status"]> = {
      "picked up": "picked_up",
      picked_up: "picked_up",
      "in transit": "in_transit",
      in_transit: "in_transit",
      delivered: "delivered",
      "attempted delivery - returned": "returned",
      returned: "returned",
      "delivery failed": "failed",
      failed: "failed",
    };
    const status = statusMap[rawStatus];
    if (!status) {
      return { valid: false, message: `Unrecognized courier status: ${rawStatus}` };
    }

    return {
      valid: true,
      trackingNumber,
      status,
      providerEventId: body.eventId ?? `${trackingNumber}:${rawStatus}`,
    };
  },
};

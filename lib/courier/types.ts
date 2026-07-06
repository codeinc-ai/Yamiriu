/** Everything a courier needs to book a shipment. Deliberately minimal — no
 * PII beyond what the courier itself requires (S-023). */
export interface ShipmentOrderContext {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  /** > 0 for COD orders; 0 for orders already paid online. */
  codAmount: number;
  items: Array<{ name: string; quantity: number }>;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  providerRef?: string;
}

export interface TrackingStatusResult {
  /** Raw, provider-specific status string (surfaced to staff as-is). */
  status: string;
  events?: Array<{ status: string; timestamp?: string }>;
}

export interface CourierWebhookResult {
  /** False if the shared secret didn't check out — caller must reject with 401. */
  valid: boolean;
  trackingNumber?: string;
  status?: "picked_up" | "in_transit" | "delivered" | "returned" | "failed";
  /** Idempotency key unique to this event — caller dedupes on this (S-017). */
  providerEventId?: string;
  message?: string;
}

/**
 * Common interface every courier implements (PRD Rule 4 — all
 * courier-specific code lives only in lib/courier/*).
 */
export interface CourierService {
  createShipment(order: ShipmentOrderContext): Promise<CreateShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingStatusResult>;
  handleWebhook(payload: unknown, signature: string | null): Promise<CourierWebhookResult>;
}

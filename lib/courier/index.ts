import type { CourierService } from "./types";
import { postexCourierService } from "./postex";

export type {
  CourierService,
  ShipmentOrderContext,
  CreateShipmentResult,
  TrackingStatusResult,
  CourierWebhookResult,
} from "./types";
export { claimCourierWebhookEvent } from "./webhook-idempotency";
export { getCourierTrackingUrl } from "./tracking-urls";

/** The one courier this project integrates against today (PRD Rule 4 keeps
 * the interface generic so a second provider can be added to this registry
 * without touching any call site). Matches the `courier_provider_name` DB
 * enum and the key used by tracking-urls.ts. */
export const ACTIVE_COURIER_PROVIDER = "postex" as const;

const REGISTRY: Record<string, CourierService> = {
  postex: postexCourierService,
};

export function getCourierService(): CourierService {
  return REGISTRY[ACTIVE_COURIER_PROVIDER];
}

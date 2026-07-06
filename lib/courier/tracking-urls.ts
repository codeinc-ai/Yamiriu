/**
 * Maps an order's stored `courierProvider` name to a tracking URL builder.
 * Add couriers here as the founders' fulfillment integrations are chosen —
 * a value that doesn't match a key here (case-insensitive) just renders the
 * tracking number as plain text with no link, so this never blocks display.
 */
const COURIER_TRACKING_URL_BUILDERS: Record<string, (trackingNumber: string) => string> = {
  tcs: (tn) => `https://www.tcsexpress.com/track/${encodeURIComponent(tn)}`,
  leopards: (tn) => `https://leopardscourier.com/tracking/${encodeURIComponent(tn)}`,
  "leopards courier": (tn) => `https://leopardscourier.com/tracking/${encodeURIComponent(tn)}`,
  postex: (tn) => `https://postex.pk/tracking?cn=${encodeURIComponent(tn)}`,
  "m&p": (tn) => `https://mnp.com.pk/tracking/${encodeURIComponent(tn)}`,
  trax: (tn) => `https://trax.com.pk/track/${encodeURIComponent(tn)}`,
};

export function getCourierTrackingUrl(
  courierProvider: string | null,
  trackingNumber: string | null
): string | null {
  if (!courierProvider || !trackingNumber) return null;
  const builder = COURIER_TRACKING_URL_BUILDERS[courierProvider.trim().toLowerCase()];
  return builder ? builder(trackingNumber) : null;
}

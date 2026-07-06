/**
 * Placeholder commerce constants — pending founder decision before launch.
 * PRD doesn't specify exact figures; these are reasonable Pakistan-market
 * defaults so the cart/checkout flow is fully functional in the meantime.
 */

// Flat-rate domestic shipping estimate shown in the cart order summary.
export const SHIPPING_FLAT_RATE = 250;

// Orders at or above this subtotal (pre-discount) ship free.
export const FREE_SHIPPING_THRESHOLD = 10_000;

// Cash on Delivery is only offered below this order total (COD fraud/risk
// mitigation for larger baskets, per PRD 2.4 / S-029).
export const COD_MAX_ORDER_VALUE = 50_000;

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

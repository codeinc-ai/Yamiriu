import type { Discount } from "@/db/schema";
import { formatPkr } from "@/lib/format";

export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Pure validation rules for a discount code, shared between the cart's
 * preview validation (actions/discounts.ts) and checkout's authoritative,
 * atomically-consumed re-validation (actions/checkout.ts) — so the two never
 * drift out of sync on what makes a code acceptable.
 */
export function validateDiscountRules(
  row: Pick<Discount, "expiresAt" | "usageLimit" | "usedCount" | "minOrderValue">,
  subtotal: number
): DiscountValidationResult {
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "This code has expired." };
  }
  if (row.usageLimit != null && row.usedCount >= row.usageLimit) {
    return { valid: false, error: "This code has reached its usage limit." };
  }
  if (row.minOrderValue && subtotal < Number(row.minOrderValue)) {
    return {
      valid: false,
      error: `This code requires a minimum order of ${formatPkr(row.minOrderValue)}.`,
    };
  }
  return { valid: true };
}

/** PKR amount to subtract from the subtotal, capped so the total never goes negative. */
export function computeDiscountAmount(
  row: Pick<Discount, "type" | "value">,
  subtotal: number
): number {
  const rawAmount =
    row.type === "percent" ? subtotal * (Number(row.value) / 100) : Number(row.value);
  return Math.min(Math.round(rawAmount), Math.round(subtotal));
}

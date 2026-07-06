"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { validateDiscountRules, computeDiscountAmount } from "@/lib/discount-rules";

const inputSchema = z.object({
  code: z.string().trim().min(1).max(50),
  subtotal: z.number().nonnegative(),
});

export interface AppliedDiscount {
  code: string;
  type: "percent" | "flat";
  value: string;
  /** PKR amount to subtract from the subtotal, already capped and rounded. */
  amount: number;
}

export interface DiscountResult {
  ok: boolean;
  error?: string;
  discount?: AppliedDiscount;
}

/**
 * Validates a discount code against the discounts table (PRD 4.5): existence,
 * expiry, usage limit, and minimum order value. Never trusts a client-supplied
 * discount amount — the server is the sole source of truth, recomputed on
 * every call from the live subtotal. This is a preview check only (no
 * `usedCount` increment) — checkout re-validates and atomically consumes the
 * code at order-placement time (see actions/checkout.ts).
 */
export async function validateDiscountCode(input: unknown): Promise<DiscountResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("api", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a discount code." };
  }

  const code = parsed.data.code.toUpperCase();
  const row = await db.query.discounts.findFirst({
    where: and(eq(discounts.code, code), isNull(discounts.deletedAt)),
  });

  if (!row) {
    return { ok: false, error: "This code isn't valid." };
  }

  const validation = validateDiscountRules(row, parsed.data.subtotal);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const amount = computeDiscountAmount(row, parsed.data.subtotal);

  return {
    ok: true,
    discount: { code: row.code, type: row.type, value: row.value, amount },
  };
}

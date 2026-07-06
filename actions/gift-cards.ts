"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { giftCards } from "@/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";

const inputSchema = z.object({
  code: z.string().trim().min(1).max(50),
});

export interface AppliedGiftCard {
  code: string;
  balance: number;
}

export interface GiftCardValidationResult {
  ok: boolean;
  error?: string;
  giftCard?: AppliedGiftCard;
}

/**
 * Preview-only check (PRD 4.8.9) — never trusted as the actual redemption:
 * checkout re-validates and atomically decrements the balance at order-placement
 * time (see actions/checkout.ts), mirroring validateDiscountCode's pattern.
 */
export async function validateGiftCardCode(input: unknown): Promise<GiftCardValidationResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("api", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a gift card code." };
  }

  const code = parsed.data.code.toUpperCase();
  const row = await db.query.giftCards.findFirst({
    where: and(eq(giftCards.code, code), isNull(giftCards.deletedAt)),
  });

  if (!row || !row.active) {
    return { ok: false, error: "This gift card isn't valid." };
  }
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This gift card has expired." };
  }
  if (Number(row.balance) <= 0) {
    return { ok: false, error: "This gift card has no remaining balance." };
  }

  return { ok: true, giftCard: { code: row.code, balance: Number(row.balance) } };
}

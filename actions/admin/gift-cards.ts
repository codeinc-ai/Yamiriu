"use server";

import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/db";
import { giftCards } from "@/db/schema";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";
import { giftCardIssueSchema } from "@/lib/validations";

export interface AdminGiftCardActionResult {
  ok: boolean;
  error?: string;
  code?: string;
}

// Unambiguous alphabet (no 0/O/1/I), mirroring lib/order-number.ts's convention.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateGiftCardCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `GC-${code}`;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCardCode();
    const existing = await db.query.giftCards.findFirst({ where: eq(giftCards.code, code) });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique gift card code.");
}

export const issueGiftCard = withPermission(
  "gift_cards:write",
  async (actor, rawInput: unknown): Promise<AdminGiftCardActionResult> => {
    const parsed = giftCardIssueSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;

    const code = await generateUniqueCode();
    const [created] = await db
      .insert(giftCards)
      .values({
        code,
        initialBalance: String(input.initialBalance),
        balance: String(input.initialBalance),
        issuedToEmail: input.issuedToEmail || null,
        issuedByUserId: actor.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .returning();

    await writeAuditLog({
      actorUserId: actor.id,
      action: "gift_card.issued",
      targetType: "gift_card",
      targetId: created.id,
      metadata: { amount: input.initialBalance },
    });

    revalidatePath("/admin/gift-cards");
    return { ok: true, code: created.code };
  }
);

export const deactivateGiftCard = withPermission(
  "gift_cards:write",
  async (actor, id: string): Promise<AdminGiftCardActionResult> => {
    const existing = await db.query.giftCards.findFirst({
      where: and(eq(giftCards.id, id), isNull(giftCards.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Gift card not found." };

    await db.update(giftCards).set({ active: false }).where(eq(giftCards.id, id));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "gift_card.deactivated",
      targetType: "gift_card",
      targetId: id,
    });

    revalidatePath("/admin/gift-cards");
    return { ok: true };
  }
);

import "server-only";
import { isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { giftCards } from "@/db/schema";

export interface AdminGiftCardRow {
  id: string;
  code: string;
  initialBalance: string;
  balance: string;
  issuedToEmail: string | null;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export async function getAdminGiftCardList(): Promise<AdminGiftCardRow[]> {
  const rows = await db
    .select({
      id: giftCards.id,
      code: giftCards.code,
      initialBalance: giftCards.initialBalance,
      balance: giftCards.balance,
      issuedToEmail: giftCards.issuedToEmail,
      active: giftCards.active,
      expiresAt: giftCards.expiresAt,
      createdAt: giftCards.createdAt,
    })
    .from(giftCards)
    .where(isNull(giftCards.deletedAt))
    .orderBy(desc(giftCards.createdAt));

  return rows.map((r) => ({
    ...r,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));
}

import "server-only";
import { and, isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";

export interface AdminDiscountRow {
  id: string;
  code: string;
  type: string;
  value: string;
  minOrderValue: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
}

export async function getAdminDiscountList(): Promise<AdminDiscountRow[]> {
  const rows = await db
    .select({
      id: discounts.id,
      code: discounts.code,
      type: discounts.type,
      value: discounts.value,
      minOrderValue: discounts.minOrderValue,
      expiresAt: discounts.expiresAt,
      usageLimit: discounts.usageLimit,
      usedCount: discounts.usedCount,
    })
    .from(discounts)
    .where(and(isNull(discounts.deletedAt)))
    .orderBy(desc(discounts.createdAt));

  return rows.map((r) => ({
    ...r,
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
  }));
}

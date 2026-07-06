"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { discounts } from "@/db/schema";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";
import { discountFormSchema } from "@/lib/validations";

export interface AdminDiscountActionResult {
  ok: boolean;
  error?: string;
}

async function assertCodeAvailable(code: string, excludeId?: string): Promise<boolean> {
  const existing = await db.query.discounts.findFirst({
    where: and(eq(discounts.code, code), isNull(discounts.deletedAt)),
  });
  return !existing || existing.id === excludeId;
}

export const createDiscount = withPermission(
  "discounts:write",
  async (actor, rawInput: unknown): Promise<AdminDiscountActionResult> => {
    const parsed = discountFormSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;

    if (!(await assertCodeAvailable(input.code))) {
      return { ok: false, error: "That code is already in use." };
    }

    const [created] = await db
      .insert(discounts)
      .values({
        code: input.code,
        type: input.type,
        value: String(input.value),
        minOrderValue: input.minOrderValue != null ? String(input.minOrderValue) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        usageLimit: input.usageLimit ?? null,
      })
      .returning();

    await writeAuditLog({
      actorUserId: actor.id,
      action: "discount.created",
      targetType: "discount",
      targetId: created.id,
      metadata: { code: input.code },
    });

    revalidatePath("/admin/discounts");
    return { ok: true };
  }
);

export const updateDiscount = withPermission(
  "discounts:write",
  async (actor, rawInput: unknown): Promise<AdminDiscountActionResult> => {
    const parsed = discountFormSchema.safeParse(rawInput);
    if (!parsed.success || !parsed.data.id) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;
    const id = input.id!;

    const existing = await db.query.discounts.findFirst({
      where: and(eq(discounts.id, id), isNull(discounts.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Discount not found." };
    if (!(await assertCodeAvailable(input.code, id))) {
      return { ok: false, error: "That code is already in use." };
    }

    await db
      .update(discounts)
      .set({
        code: input.code,
        type: input.type,
        value: String(input.value),
        minOrderValue: input.minOrderValue != null ? String(input.minOrderValue) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        usageLimit: input.usageLimit ?? null,
      })
      .where(eq(discounts.id, id));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "discount.updated",
      targetType: "discount",
      targetId: id,
      metadata: { code: input.code },
    });

    revalidatePath("/admin/discounts");
    return { ok: true };
  }
);

export const deactivateDiscount = withPermission(
  "discounts:write",
  async (actor, id: string): Promise<AdminDiscountActionResult> => {
    const existing = await db.query.discounts.findFirst({
      where: and(eq(discounts.id, id), isNull(discounts.deletedAt)),
    });
    if (!existing) return { ok: false, error: "Discount not found." };

    await db.update(discounts).set({ deletedAt: new Date() }).where(eq(discounts.id, id));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "discount.deleted",
      targetType: "discount",
      targetId: id,
    });

    revalidatePath("/admin/discounts");
    return { ok: true };
  }
);

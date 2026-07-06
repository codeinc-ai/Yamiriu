"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";

export interface AdminCustomerActionResult {
  ok: boolean;
  error?: string;
}

export const banCustomer = withPermission(
  "customers:write",
  async (actor, userId: string): Promise<AdminCustomerActionResult> => {
    const target = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.role, "customer")),
    });
    if (!target) return { ok: false, error: "Customer not found." };

    await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "customer.banned",
      targetType: "user",
      targetId: userId,
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${userId}`);
    return { ok: true };
  }
);

export const unbanCustomer = withPermission(
  "customers:write",
  async (actor, userId: string): Promise<AdminCustomerActionResult> => {
    const target = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.role, "customer")),
    });
    if (!target) return { ok: false, error: "Customer not found." };

    await db.update(users).set({ isActive: true }).where(eq(users.id, userId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "customer.unbanned",
      targetType: "user",
      targetId: userId,
    });

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${userId}`);
    return { ok: true };
  }
);

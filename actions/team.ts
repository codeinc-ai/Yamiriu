"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ROLES, type Role } from "@/lib/rbac";
import { withPermission } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ROLES),
});

export interface TeamActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Change a user's role. Owner-only capability (`team:manage`, PRD S-002), with
 * an audit-log entry recording the before/after role (S-027).
 */
export const updateUserRole = withPermission(
  "team:manage",
  async (actor, input: { userId: string; role: Role }): Promise<TeamActionResult> => {
    const parsed = updateRoleSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Invalid role assignment." };
    }

    const target = await db.query.users.findFirst({
      where: eq(users.id, parsed.data.userId),
    });
    if (!target) {
      return { ok: false, error: "User not found." };
    }
    if (target.role === parsed.data.role) {
      return { ok: true, message: "No change — user already has that role." };
    }

    await db
      .update(users)
      .set({ role: parsed.data.role })
      .where(eq(users.id, parsed.data.userId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "user.role_changed",
      targetType: "user",
      targetId: parsed.data.userId,
      metadata: { from: target.role, to: parsed.data.role },
    });

    return { ok: true, message: "Role updated." };
  }
);

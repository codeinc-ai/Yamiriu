"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { users, teamInvites } from "@/db/schema";
import { withRole } from "@/lib/auth-guards";
import { writeAuditLog } from "@/lib/audit";
import { teamInviteSchema } from "@/lib/validations";
import { createTeamInvite } from "@/lib/team-invites";
import { sendTeamInviteEmail } from "@/lib/email";
import { env } from "@/lib/env";

export interface AdminTeamActionResult {
  ok: boolean;
  error?: string;
}

/** Team management is owner-only (PRD 4.8.5) — admin explicitly lacks
 * team:manage in the RBAC matrix, but this is gated on the role directly
 * (not just the permission) since that's the literal requirement. */
export const inviteTeamMember = withRole(
  ["owner"],
  async (actor, rawInput: unknown): Promise<AdminTeamActionResult> => {
    const parsed = teamInviteSchema.safeParse(rawInput);
    if (!parsed.success) return { ok: false, error: "Please check the form and try again." };
    const input = parsed.data;

    const existingUser = await db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (existingUser) return { ok: false, error: "A user with that email already exists." };

    const existingInvite = await db.query.teamInvites.findFirst({
      where: and(eq(teamInvites.email, input.email), isNull(teamInvites.consumedAt), gt(teamInvites.expiresAt, new Date())),
    });
    if (existingInvite) return { ok: false, error: "An invite for that email is already pending." };

    const rawToken = await createTeamInvite(input.email, input.role, actor.id);
    const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${rawToken}`;

    try {
      await sendTeamInviteEmail(input.email, { inviteUrl, role: input.role });
    } catch (error) {
      console.error("[team] failed to send invite email", error);
    }

    await writeAuditLog({
      actorUserId: actor.id,
      action: "team.invited",
      targetType: "team_invite",
      metadata: { role: input.role },
    });

    revalidatePath("/admin/team");
    return { ok: true };
  }
);

export const deactivateTeamMember = withRole(
  ["owner"],
  async (actor, userId: string): Promise<AdminTeamActionResult> => {
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target || target.role === "customer") return { ok: false, error: "Staff member not found." };
    if (target.id === actor.id) return { ok: false, error: "You can't deactivate your own account." };

    await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "team.deactivated",
      targetType: "user",
      targetId: userId,
    });

    revalidatePath("/admin/team");
    return { ok: true };
  }
);

export const reactivateTeamMember = withRole(
  ["owner"],
  async (actor, userId: string): Promise<AdminTeamActionResult> => {
    const target = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!target || target.role === "customer") return { ok: false, error: "Staff member not found." };

    await db.update(users).set({ isActive: true }).where(eq(users.id, userId));

    await writeAuditLog({
      actorUserId: actor.id,
      action: "team.reactivated",
      targetType: "user",
      targetId: userId,
    });

    revalidatePath("/admin/team");
    return { ok: true };
  }
);

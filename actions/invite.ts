"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumeTeamInvite } from "@/lib/team-invites";
import { passwordSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

const acceptInviteSchema = z.object({
  token: z.string().trim().min(1),
  password: passwordSchema,
});

export interface AcceptInviteResult {
  ok: boolean;
  error?: string;
}

/** Public action (no session required) — the invite token itself is the
 * credential (PRD 4.8.5). Creates the staff account with the role set at
 * invite time; email is treated as pre-verified since the owner vouched
 * for it by inviting that address. */
export async function acceptTeamInvite(rawInput: unknown): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const consumed = await consumeTeamInvite(parsed.data.token);
  if (!consumed) {
    return { ok: false, error: "This invite link is invalid or has expired." };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.email, consumed.email) });
  if (existing) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const [user] = await db
    .insert(users)
    .values({
      email: consumed.email,
      passwordHash,
      role: consumed.role,
      emailVerified: new Date(),
    })
    .returning();

  await writeAuditLog({
    actorUserId: user.id,
    action: "account.created",
    targetType: "user",
    targetId: user.id,
    metadata: { provider: "team_invite", role: consumed.role },
  });

  return { ok: true };
}

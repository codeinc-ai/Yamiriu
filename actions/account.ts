"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { signOut } from "@/lib/auth";
import { withAuth } from "@/lib/auth-guards";
import { setSessionsValidFrom } from "@/lib/session-invalidation";
import { writeAuditLog } from "@/lib/audit";

export interface AccountActionResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Profile edit (optimistic on the client — WF-010)
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
});

export const updateProfile = withAuth(
  async (user, rawInput: unknown): Promise<AccountActionResult> => {
    const parsed = profileSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "Enter a valid name." };
    }

    await db.update(users).set({ name: parsed.data.name }).where(eq(users.id, user.id));
    return { ok: true };
  }
);

// ---------------------------------------------------------------------------
// Delete account (WF-010) — type-your-email confirm, immediate PII scrub,
// orders retained but anonymized for accounting/audit purposes.
// ---------------------------------------------------------------------------

const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().toLowerCase(),
});

export const deleteAccount = withAuth(
  async (user, rawInput: unknown): Promise<AccountActionResult> => {
    const parsed = deleteAccountSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!dbUser) {
      return { ok: false, error: "Account not found." };
    }
    if (parsed.data.confirmEmail !== dbUser.email.toLowerCase()) {
      return { ok: false, error: "That email doesn't match your account. Please type it exactly." };
    }

    const now = new Date();

    await db
      .update(users)
      .set({
        email: `deleted-${user.id}@deleted.yamiriu.invalid`,
        name: null,
        image: null,
        passwordHash: null,
        sessionsValidFrom: now,
        deletedAt: now,
      })
      .where(eq(users.id, user.id));

    // Orders are never hard-deleted (accounting/audit retention) — only the
    // customer-identifying fields on them are scrubbed. The order row, its
    // items, and totals stay intact under the now-anonymized userId.
    await db
      .update(orders)
      .set({
        customerPhone: "[deleted]",
        shippingAddress: { fullName: "[deleted]", addressLine1: "[deleted]", city: "[deleted]" },
      })
      .where(eq(orders.userId, user.id));

    await setSessionsValidFrom(user.id, now.getTime());

    await writeAuditLog({
      actorUserId: user.id,
      action: "account.deleted",
      targetType: "user",
      targetId: user.id,
    });

    await signOut({ redirect: false });

    return { ok: true };
  }
);

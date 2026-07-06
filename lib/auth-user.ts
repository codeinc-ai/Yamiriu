import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@/lib/rbac";

/** Node-only helpers that touch the DB. Never import into the Edge bundle. */

export interface TokenUser {
  id: string;
  role: Role;
  sessionsValidFrom: Date;
}

async function findActiveUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: and(eq(users.email, email), isNull(users.deletedAt)),
  });
}

/**
 * Resolve (or lazily create) our DB user for an OAuth sign-in. New Google users
 * are created as `customer` and treated as verified (Google asserts the email).
 */
export async function getOrCreateOAuthUser(input: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<TokenUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await findActiveUserByEmail(email);
  if (existing) {
    return {
      id: existing.id,
      role: existing.role,
      sessionsValidFrom: existing.sessionsValidFrom,
    };
  }

  try {
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: input.name ?? null,
        image: input.image ?? null,
        role: "customer",
        emailVerified: new Date(),
      })
      .returning();

    await writeAuditLog({
      actorUserId: created.id,
      action: "account.created",
      targetType: "user",
      targetId: created.id,
      metadata: { provider: "google" },
    });

    return {
      id: created.id,
      role: created.role,
      sessionsValidFrom: created.sessionsValidFrom,
    };
  } catch {
    // Race: a concurrent sign-in created the row first. Re-select.
    const raced = await findActiveUserByEmail(email);
    if (raced) {
      return {
        id: raced.id,
        role: raced.role,
        sessionsValidFrom: raced.sessionsValidFrom,
      };
    }
    throw new Error("Failed to resolve OAuth user.");
  }
}

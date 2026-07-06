import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { teamInvites } from "@/db/schema";
import type { Role } from "@/lib/rbac";

/** Same hashed-token pattern as lib/tokens.ts — only a SHA-256 hash is
 * persisted, the raw token exists solely in the emailed link (PRD 4.8.5). */
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createTeamInvite(
  email: string,
  role: Role,
  invitedByUserId: string
): Promise<string> {
  const raw = generateRawToken();
  await db.insert(teamInvites).values({
    email: email.toLowerCase(),
    role,
    invitedByUserId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });
  return raw;
}

export interface ConsumedTeamInvite {
  email: string;
  role: Role;
}

export async function consumeTeamInvite(raw: string): Promise<ConsumedTeamInvite | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  const record = await db.query.teamInvites.findFirst({
    where: and(eq(teamInvites.tokenHash, tokenHash), isNull(teamInvites.consumedAt), gt(teamInvites.expiresAt, now)),
  });
  if (!record) return null;

  await db.update(teamInvites).set({ consumedAt: now }).where(eq(teamInvites.id, record.id));

  return { email: record.email, role: record.role };
}

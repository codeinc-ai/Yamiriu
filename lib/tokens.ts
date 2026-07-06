import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationTokens, passwordResetTokens } from "@/db/schema";

/**
 * Opaque single-use tokens for email verification and password reset. Only a
 * SHA-256 hash is persisted; the raw token exists solely in the emailed link, so
 * a DB compromise cannot be used to verify accounts or reset passwords.
 */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1h (WF-003)

function generateRawToken(): string {
  return randomBytes(32).toString("hex");
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const raw = generateRawToken();
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
  });
  return raw;
}

export async function createPasswordResetToken(
  userId: string
): Promise<string> {
  // Invalidate any outstanding reset tokens so only the newest link works.
  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.consumedAt)
      )
    );

  const raw = generateRawToken();
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });
  return raw;
}

/** Consume an email-verification token; returns the userId or null. */
export async function consumeEmailVerificationToken(
  raw: string
): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  const record = await db.query.emailVerificationTokens.findFirst({
    where: and(
      eq(emailVerificationTokens.tokenHash, tokenHash),
      isNull(emailVerificationTokens.consumedAt),
      gt(emailVerificationTokens.expiresAt, now)
    ),
  });
  if (!record) return null;

  await db
    .update(emailVerificationTokens)
    .set({ consumedAt: now })
    .where(eq(emailVerificationTokens.id, record.id));

  return record.userId;
}

/** Consume a password-reset token; returns the userId or null. */
export async function consumePasswordResetToken(
  raw: string
): Promise<string | null> {
  const tokenHash = hashToken(raw);
  const now = new Date();

  const record = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.tokenHash, tokenHash),
      isNull(passwordResetTokens.consumedAt),
      gt(passwordResetTokens.expiresAt, now)
    ),
  });
  if (!record) return null;

  await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(eq(passwordResetTokens.id, record.id));

  return record.userId;
}

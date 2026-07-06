"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { auth, signIn, signOut } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations";
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
} from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import {
  getLockoutState,
  recordFailedAttempt,
  clearLockout,
} from "@/lib/lockout";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import { setSessionsValidFrom } from "@/lib/session-invalidation";
import { sanitizeCallbackUrl } from "@/lib/auth-access";
import { writeAuditLog } from "@/lib/audit";
import { withAuth } from "@/lib/auth-guards";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

// Identical response whether or not the account exists (PRD S-006).
const SIGNUP_MESSAGE =
  "Almost there — check your email to confirm your account.";
const RESET_REQUEST_MESSAGE =
  "If an account exists for that email, we've sent password reset instructions.";

function firstFieldErrors(
  error: import("zod").ZodError
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function formatDuration(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  if (minutes <= 1) return "a minute";
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? "an hour" : `${hours} hours`;
}

// Next.js control-flow "errors" (redirect / notFound) must be re-thrown, never
// swallowed by a catch that assumes an auth failure.
function isNextControlFlowError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest === "NEXT_NOT_FOUND")
  );
}

// ---------------------------------------------------------------------------
// Sign up (WF-001)
// ---------------------------------------------------------------------------
export async function signUp(input: unknown): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("auth", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Enumeration-safe: identical success response for taken emails, no account
  // created and no email sent.
  if (existing) {
    return { ok: true, message: SIGNUP_MESSAGE };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role: "customer" })
    .returning();

  await writeAuditLog({
    actorUserId: user.id,
    action: "account.created",
    targetType: "user",
    targetId: user.id,
    metadata: { provider: "credentials" },
  });

  const token = await createEmailVerificationToken(user.id);
  const verifyUrl = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendVerificationEmail(email, verifyUrl, name);

  return { ok: true, message: SIGNUP_MESSAGE };
}

// ---------------------------------------------------------------------------
// Credentials sign in (WF-002) — orchestrates lockout + rate limit around the
// raw credential check in auth.ts.
// ---------------------------------------------------------------------------
export async function signInWithCredentials(input: {
  email: string;
  password: string;
  callbackUrl?: string;
}): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("auth", ip);
  if (!rl.success) {
    return {
      ok: false,
      error: "Too many attempts. Please try again in a minute.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: input.email,
    password: input.password,
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }
  const { email, password } = parsed.data;

  const lock = await getLockoutState(email);
  if (lock.locked) {
    return {
      ok: false,
      error: `Too many failed attempts. Try again in ${formatDuration(
        lock.retryAfterSeconds
      )}.`,
    };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;

    const state = await recordFailedAttempt(email);
    if (state.locked) {
      return {
        ok: false,
        error: `Too many failed attempts. Your account is locked for ${formatDuration(
          state.retryAfterSeconds
        )}.`,
      };
    }
    const remaining =
      state.attemptsRemaining > 0 && state.attemptsRemaining <= 2
        ? ` ${state.attemptsRemaining} attempt${
            state.attemptsRemaining === 1 ? "" : "s"
          } remaining.`
        : "";
    return { ok: false, error: `Invalid email or password.${remaining}` };
  }

  await clearLockout(email);
  return { ok: true, redirectTo: sanitizeCallbackUrl(input.callbackUrl) };
}

// ---------------------------------------------------------------------------
// Google sign in — triggers the OAuth redirect (state + PKCE by default).
// ---------------------------------------------------------------------------
export async function signInWithGoogle(callbackUrl?: string): Promise<void> {
  await signIn("google", { redirectTo: sanitizeCallbackUrl(callbackUrl) });
}

// ---------------------------------------------------------------------------
// Forgot password (WF-003) — enumeration-safe.
// ---------------------------------------------------------------------------
export async function requestPasswordReset(
  input: unknown
): Promise<ActionResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("auth", ip);
  const parsed = forgotPasswordSchema.safeParse(input);

  if (rl.success && parsed.success) {
    const { email } = parsed.data;
    const user = await db.query.users.findFirst({
      where: and(eq(users.email, email), isNull(users.deletedAt)),
    });
    // Only credential accounts (with a password) get a reset link.
    if (user?.passwordHash) {
      const token = await createPasswordResetToken(user.id);
      const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl, user.name);
    }
  }

  return { ok: true, message: RESET_REQUEST_MESSAGE };
}

// ---------------------------------------------------------------------------
// Reset password (WF-003) — 1h token + invalidate all sessions.
// ---------------------------------------------------------------------------
export async function resetPassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: firstFieldErrors(parsed.error),
    };
  }

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const now = new Date();
  await db
    .update(users)
    .set({ passwordHash, sessionsValidFrom: now })
    .where(eq(users.id, userId));

  // Invalidate every existing session (S-004).
  await setSessionsValidFrom(userId, now.getTime());

  await writeAuditLog({
    actorUserId: userId,
    action: "account.password_reset",
    targetType: "user",
    targetId: userId,
  });

  return {
    ok: true,
    message: "Your password has been reset. You can now sign in.",
  };
}

// ---------------------------------------------------------------------------
// Verify email (called from the /verify-email page).
// ---------------------------------------------------------------------------
export async function verifyEmailToken(
  rawToken: string
): Promise<{ ok: boolean }> {
  const userId = await consumeEmailVerificationToken(rawToken);
  if (!userId) return { ok: false };
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, userId));
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Change password (authenticated) — audits + invalidates other sessions.
// ---------------------------------------------------------------------------
export const changePassword = withAuth(
  async (user, input: unknown): Promise<ActionResult> => {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: "Please correct the highlighted fields.",
        fieldErrors: firstFieldErrors(parsed.error),
      };
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
    if (!dbUser?.passwordHash) {
      return {
        ok: false,
        error: "Password change isn't available for this account.",
      };
    }

    const valid = await bcrypt.compare(
      parsed.data.currentPassword,
      dbUser.passwordHash
    );
    if (!valid) {
      return { ok: false, error: "Your current password is incorrect." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    const now = new Date();
    await db
      .update(users)
      .set({ passwordHash, sessionsValidFrom: now })
      .where(eq(users.id, user.id));

    await setSessionsValidFrom(user.id, now.getTime());

    await writeAuditLog({
      actorUserId: user.id,
      action: "account.password_changed",
      targetType: "user",
      targetId: user.id,
    });

    return { ok: true, message: "Your password has been updated." };
  }
);

// ---------------------------------------------------------------------------
// Sign out (current session) and sign out everywhere (S-008).
// ---------------------------------------------------------------------------
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

export const signOutEverywhere = withAuth(async (user): Promise<void> => {
  const now = new Date();
  await db
    .update(users)
    .set({ sessionsValidFrom: now })
    .where(eq(users.id, user.id));
  await setSessionsValidFrom(user.id, now.getTime());
  await writeAuditLog({
    actorUserId: user.id,
    action: "account.sessions_revoked",
    targetType: "user",
    targetId: user.id,
  });
  await signOut({ redirect: false });
});

/** Convenience for server components: the current session's user (or null). */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

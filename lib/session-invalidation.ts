import { redis } from "@/lib/redis";

/**
 * Stateless "sign out everywhere" watermark (PRD S-004, S-008).
 *
 * JWT sessions are stateless, so to revoke them we keep a per-user "not valid
 * before" timestamp in Redis. A token whose `loginAt` predates the watermark is
 * rejected in the jwt callback. On password reset / sign-out-all we bump the
 * watermark to now, instantly invalidating every previously issued token.
 *
 * Fail-open when Redis is unconfigured (dev): revocation simply isn't enforced,
 * but a changed password still blocks future credential logins.
 */
function key(userId: string): string {
  return `sv:${userId}`;
}

/** Force-set the watermark (call on password reset / sign-out-all). */
export async function setSessionsValidFrom(
  userId: string,
  atMs: number
): Promise<void> {
  if (!redis) return;
  await redis.set(key(userId), atMs);
}

/** Seed the watermark at login if none exists (never clobber a newer reset). */
export async function primeSessionWatermark(
  userId: string,
  atMs: number
): Promise<void> {
  if (!redis) return;
  await redis.set(key(userId), atMs, { nx: true });
}

/** True if a token minted at `tokenLoginAt` has been revoked. */
export async function isSessionInvalidated(
  userId: string,
  tokenLoginAt: number
): Promise<boolean> {
  if (!redis) return false;
  const watermark = await redis.get<number>(key(userId));
  if (watermark == null) return false;
  return tokenLoginAt < Number(watermark);
}

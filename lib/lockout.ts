import { redis, warnRedisUnconfiguredOnce } from "@/lib/redis";

/**
 * Account lockout after repeated failed logins (PRD S-005, WF-002).
 * 5 failed attempts -> 15-minute lock, doubling on each subsequent lock cycle
 * (exponential backoff), capped at 24h. Tracked in Upstash Redis; a no-op when
 * Redis is unconfigured (local dev).
 */
const THRESHOLD = 5;
const BASE_LOCK_MINUTES = 15;
const MAX_LOCK_MINUTES = 24 * 60;
const ATTEMPT_WINDOW_SECONDS = 24 * 60 * 60;

export interface LockoutState {
  locked: boolean;
  retryAfterSeconds: number;
  /** Attempts left in the current cycle before the account locks. */
  attemptsRemaining: number;
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function attemptsKey(email: string): string {
  return `lockout:attempts:${normalize(email)}`;
}

function untilKey(email: string): string {
  return `lockout:until:${normalize(email)}`;
}

function lockMinutesForCycle(cycle: number): number {
  const minutes = BASE_LOCK_MINUTES * 2 ** (cycle - 1);
  return Math.min(minutes, MAX_LOCK_MINUTES);
}

function remainingInCycle(attempts: number): number {
  const withinCycle = attempts % THRESHOLD;
  return withinCycle === 0 ? 0 : THRESHOLD - withinCycle;
}

const UNLOCKED: LockoutState = {
  locked: false,
  retryAfterSeconds: 0,
  attemptsRemaining: THRESHOLD,
};

/** Current lockout status without recording a new attempt. */
export async function getLockoutState(email: string): Promise<LockoutState> {
  if (!redis) {
    warnRedisUnconfiguredOnce("account lockout");
    return UNLOCKED;
  }

  const [untilRaw, attemptsRaw] = await Promise.all([
    redis.get<number>(untilKey(email)),
    redis.get<number>(attemptsKey(email)),
  ]);

  const attempts = Number(attemptsRaw ?? 0);
  const until = Number(untilRaw ?? 0);
  const now = Date.now();

  if (until > now) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((until - now) / 1000),
      attemptsRemaining: 0,
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    attemptsRemaining: remainingInCycle(attempts),
  };
}

/** Record a failed login and return the resulting lockout state. */
export async function recordFailedAttempt(email: string): Promise<LockoutState> {
  if (!redis) {
    warnRedisUnconfiguredOnce("account lockout");
    return UNLOCKED;
  }

  const attempts = await redis.incr(attemptsKey(email));
  await redis.expire(attemptsKey(email), ATTEMPT_WINDOW_SECONDS);

  // Every time we cross a multiple of THRESHOLD, (re)apply an escalating lock.
  if (attempts % THRESHOLD === 0) {
    const cycle = attempts / THRESHOLD;
    const lockMs = lockMinutesForCycle(cycle) * 60 * 1000;
    const until = Date.now() + lockMs;
    await redis.set(untilKey(email), until, { px: lockMs });
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(lockMs / 1000),
      attemptsRemaining: 0,
    };
  }

  return {
    locked: false,
    retryAfterSeconds: 0,
    attemptsRemaining: remainingInCycle(attempts),
  };
}

/** Clear all lockout state for an email (call on successful login). */
export async function clearLockout(email: string): Promise<void> {
  if (!redis) return;
  await Promise.all([
    redis.del(attemptsKey(email)),
    redis.del(untilKey(email)),
  ]);
}

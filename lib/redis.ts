import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

/**
 * Shared Upstash Redis client (REST/HTTP based — Edge-compatible).
 * Null when not configured, so local dev works without Upstash; callers must
 * degrade gracefully (rate limiting / lockout become no-ops in that case).
 */
export const redis: Redis | null =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

let warned = false;
export function warnRedisUnconfiguredOnce(context: string): void {
  if (!redis && !warned) {
    warned = true;
    console.warn(
      `[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — ${context} is disabled. ` +
        `Configure Upstash before production (PRD S-016, S-005).`
    );
  }
}

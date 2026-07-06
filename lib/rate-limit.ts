import { Ratelimit } from "@upstash/ratelimit";
import { redis, warnRedisUnconfiguredOnce } from "@/lib/redis";

/**
 * Rate-limit buckets per PRD S-016:
 * - auth:     5 req / min per IP
 * - api:      60 req / min per user
 * - uploads:  10 req / min per user
 * - checkout: 10 req / min per IP
 *
 * When Redis is unconfigured (local dev) every check passes; production must
 * have Upstash set.
 */
type BucketName = "auth" | "api" | "uploads" | "checkout";

const BUCKET_CONFIG: Record<BucketName, { tokens: number; window: `${number} s` }> =
  {
    auth: { tokens: 5, window: "60 s" },
    api: { tokens: 60, window: "60 s" },
    uploads: { tokens: 10, window: "60 s" },
    checkout: { tokens: 10, window: "60 s" },
  };

const limiters = new Map<BucketName, Ratelimit>();

function getLimiter(bucket: BucketName): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters.get(bucket);
  if (!limiter) {
    const { tokens, window } = BUCKET_CONFIG[bucket];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      prefix: `ratelimit:${bucket}`,
      analytics: false,
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Consume one token from `bucket` for `identifier` (an IP or user id).
 * Returns `{ success: true }` unconditionally when Redis is not configured.
 */
export async function checkRateLimit(
  bucket: BucketName,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(bucket);
  if (!limiter) {
    warnRedisUnconfiguredOnce("rate limiting");
    return { success: true, remaining: Number.POSITIVE_INFINITY, reset: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(identifier);
  return { success, remaining, reset };
}

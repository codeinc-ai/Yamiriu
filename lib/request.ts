/**
 * Extract the best-guess client IP from request headers. Vercel sets
 * `x-forwarded-for` (client is the first entry). Falls back to a sentinel so
 * rate-limit keys never collapse silently.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

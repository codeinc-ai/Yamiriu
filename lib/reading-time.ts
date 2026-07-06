const WORDS_PER_MINUTE = 200;

/** Reading-time estimate for a journal post body (plain text or sanitized
 * HTML — tags don't meaningfully skew a word count at this granularity). */
export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

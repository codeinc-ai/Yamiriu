import * as Sentry from "@sentry/nextjs";

/** Error reporting (Sentry, PRD 2.8 / §13.1) — no-ops safely when no DSN is
 * configured (see sentry.*.config.ts / instrumentation-client.ts). */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  console.error("[error]", error, context ?? {});
  Sentry.captureException(error, { extra: context });
}

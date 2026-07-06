import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || undefined,
  tracesSampleRate: 0.1,
  // No session replay — this project's PII policy (S-023) keeps Sentry to
  // stack traces/breadcrumbs only, same rule PostHog follows (lib/analytics.ts).
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

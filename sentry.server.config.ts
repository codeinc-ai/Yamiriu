import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: 0.1,
  // Payment webhook/return-URL routes and Server Actions already log their
  // own context (lib/report-error.ts) — keep debug logging off in prod.
  debug: false,
});

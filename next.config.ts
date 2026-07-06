import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

// `connect-src` includes `data:` so the outfit-builder's thumbnail capture
// (lib/outfit-thumbnail.ts) can `fetch()` a data: URL to convert it to a
// Blob before uploading — without it, that fetch is silently blocked by CSP.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://*.ufs.sh https://utfs.io;
  font-src 'self';
  connect-src 'self' data: https://*.posthog.com https://*.ufs.sh https://utfs.io https://*.uploadthing.com https://*.sentry.io https://*.ingest.us.sentry.io;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  worker-src 'self' blob:;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  // @electric-sql/pglite (local-dev DB fallback, db/index.ts) uses Node's fs
  // directly and breaks when Turbopack bundles it into the server chunk;
  // load it via native require instead.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Static-generation workers each boot their own in-memory PGlite instance
  // when DATABASE_URL uses the pglite:// dev fallback (db/index.ts) — on a
  // low-memory machine, the default per-CPU worker count OOMs. Capping it
  // is a no-op in production (a real DATABASE_URL never hits this path) and
  // just slows local builds slightly.
  experimental: { cpus: 2 },
  images: {
    // Saved-outfit thumbnails (WF-004) are hosted on UploadThing's CDN.
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source maps are uploaded post-build (autoInstrumentServerFunctions/
  // autoInstrumentMiddleware are no-ops under Turbopack) — silent avoids
  // noisy CLI output when SENTRY_AUTH_TOKEN isn't set locally.
  silent: true,
  widenClientFileUpload: true,
});

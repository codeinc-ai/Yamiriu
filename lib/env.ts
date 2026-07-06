import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  DATABASE_URL: z.url(),
  DATABASE_URL_UNPOOLED: z.url(),
  NEXTAUTH_URL: z.url(),
  NEXTAUTH_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // uploadthing v7 auth token (base64, contains apiKey/appId/regions) — the
  // old SECRET+APP_ID pair was a v6-era convention this SDK no longer reads.
  UPLOADTHING_TOKEN: z.string().min(1).optional(),

  JAZZCASH_MERCHANT_ID: z.string().min(1).optional(),
  JAZZCASH_PASSWORD: z.string().min(1).optional(),
  JAZZCASH_INTEGRITY_SALT: z.string().min(1).optional(),

  EASYPAISA_STORE_ID: z.string().min(1).optional(),
  EASYPAISA_HASH_KEY: z.string().min(1).optional(),

  // PayFast Pakistan (apps.net.pk) — the currently-selected card adapter
  // behind lib/payments/card.ts. Swappable for HBL PayPlus/Bank Alfalah
  // later without touching the payment interface (PRD 2.4).
  PAYFAST_MERCHANT_ID: z.string().min(1).optional(),
  PAYFAST_SECURED_KEY: z.string().min(1).optional(),

  WHATSAPP_BUSINESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),

  // SMS fallback (lib/sms/) — local Pakistani gateway credentials, provider
  // TBD (see lib/sms/local-gateway.ts for the adapter to swap in).
  SMS_GATEWAY_API_KEY: z.string().min(1).optional(),
  SMS_GATEWAY_SENDER_ID: z.string().min(1).optional(),

  // PostEx (api.postex.pk) integration token — sent as the `token` header on
  // every request (lib/courier/postex.ts). Named COURIER_API_KEY rather than
  // POSTEX_* since PRD Rule 4 treats the courier as swappable behind a common
  // interface, matching the existing .env.example convention.
  COURIER_API_KEY: z.string().min(1).optional(),
  COURIER_PICKUP_ADDRESS_CODE: z.string().min(1).optional(),
  COURIER_STORE_ADDRESS_CODE: z.string().min(1).optional(),
  // Shared secret for /api/webhooks/courier — PostEx does not publicly
  // document a webhook signature scheme, so delivery-status callbacks are
  // secured the same way the internal cron endpoint is (S-017 fail-closed).
  COURIER_WEBHOOK_SECRET: z.string().min(16).optional(),

  // Shared secret the auto-cancel cron route checks against an incoming
  // header — without it configured, the route refuses to run (fails closed).
  CRON_SECRET: z.string().min(16).optional(),

  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),

  SENTRY_DSN: z.url().optional(),
  // Client bundle needs its own NEXT_PUBLIC_-prefixed copy (instrumentation-client.ts)
  // — server/edge configs read the unprefixed SENTRY_DSN above.
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  SENTRY_ORG: z.string().min(1).optional(),
  SENTRY_PROJECT: z.string().min(1).optional(),

  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${issues}\n\nCheck .env.example for the full list of required variables.`
    );
  }

  return parsed.data;
}

export const env = loadEnv();

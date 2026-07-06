# Launch Checklist — Yamiriu

A founder-facing punch list for taking this from "built" to "live." Nothing
here requires touching code — it's environment config, account setup, and
content you need to fill in before `yamiriu.com` goes public.

---

## 1. Environment variables to fill in

Copy `.env.example` to your production environment (Vercel Project Settings →
Environment Variables) and fill in every value below. Everything not listed
here is either already correct as a default or optional.

| Variable | Where to get it | Required for |
|---|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Neon dashboard → Connection Details (pooled + direct) | Everything — the app has no functioning fallback in production |
| `NEXTAUTH_URL` | Your production domain, e.g. `https://yamiriu.com` | Sign-in/session cookies |
| `NEXTAUTH_SECRET` | Generate once: `openssl rand -base64 32` | Session encryption — **never reuse the dev value** |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client (set the authorized redirect URI to `https://yamiriu.com/api/auth/callback/google`) | "Sign in with Google" |
| `RESEND_API_KEY`, `EMAIL_FROM` | Resend dashboard; verify your sending domain first | All transactional emails (order confirmation, password reset, invites) |
| `UPLOADTHING_TOKEN` | UploadThing dashboard → API Keys | Product/review/content image & 3D model uploads |
| `JAZZCASH_MERCHANT_ID`, `JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT` | JazzCash merchant portal (production credentials, not sandbox) | JazzCash checkout |
| `EASYPAISA_STORE_ID`, `EASYPAISA_HASH_KEY` | Easypaisa merchant portal | Easypaisa checkout |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_SECURED_KEY` | PayFast (apps.net.pk) merchant portal | Card checkout |
| `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Meta Business/WhatsApp Cloud API dashboard | WhatsApp order notifications + the "Chat with us" CTA |
| `COURIER_API_KEY`, `COURIER_PICKUP_ADDRESS_CODE`, `COURIER_STORE_ADDRESS_CODE`, `COURIER_WEBHOOK_SECRET` | PostEx merchant dashboard | Courier handoff + delivery-status webhook |
| `CRON_SECRET` | Generate once: `openssl rand -base64 24` — must match what you configure the scheduler with | Auto-cancel cron (see §7) |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | PostHog project settings | Analytics |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | Sentry project settings (same DSN for both — one is server-side, one is the client bundle's copy) | Error monitoring |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Sentry org settings → Auth Tokens (`project:releases` scope) | Source-map upload at build time (stack traces resolve to real code, not minified bundles) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Upstash console → Redis database → REST API | **Rate limiting is silently disabled without this** — see §2 |
| Google Search Console verification | Search Console → Settings → Ownership verification → HTML tag, or add the DNS TXT record it gives you | SEO — sitemap submission, indexing status |
| Alert email / Slack webhook | Sentry → Alerts → add an integration; PostHog → Alerts (optional) | Getting paged when something breaks in production |

**Do not launch without Upstash configured.** `lib/rate-limit.ts` fails open
(allows every request) when Redis isn't configured — correct for local dev,
but it means auth, checkout, uploads, and track-order have **no** abuse
protection in production until this is set.

---

## 2. DNS for yamiriu.com

1. In Vercel: Project → Settings → Domains → add `yamiriu.com` and `www.yamiriu.com`.
2. At your domain registrar, point:
   - `A` record for the apex (`yamiriu.com`) → Vercel's provided IP, **or**
   - `CNAME` for `www` → `cname.vercel-dns.com` (Vercel will show the exact
     target once you add the domain).
3. Set your primary domain (apex or `www`) in Vercel and let it redirect the
   other — don't serve the app on both without a redirect (duplicate-content
   SEO issue, and `SITE_URL`/canonical tags assume one canonical host).
4. Update `NEXT_PUBLIC_APP_URL` to match whichever host you chose as primary
   — this feeds every canonical URL, OG image URL, and email link in the app.
5. Wait for SSL to provision (automatic via Vercel, usually minutes) before
   directing real traffic.

---

## 3. Enable 2FA everywhere

Every one of these accounts can move money, ship orders, or take the site
down. Turn on two-factor authentication before launch, not after:

- [ ] Vercel (account + team, if applicable)
- [ ] GitHub (the repo's owner account and any collaborators)
- [ ] Neon (database console)
- [ ] JazzCash merchant portal
- [ ] Easypaisa merchant portal
- [ ] PayFast merchant portal
- [ ] PostEx merchant dashboard
- [ ] Resend, UploadThing, Sentry, PostHog, Upstash (lower stakes, but still
      hold API keys with write access)

---

## 4. Sandbox → production payment switch

Full sandbox testing steps are in [PAYMENTS_TESTING.md](PAYMENTS_TESTING.md).
At launch:

1. Replace every `JAZZCASH_*` / `EASYPAISA_*` / `PAYFAST_*` env var with the
   **production** credentials from each merchant portal (not the sandbox
   ones used during development/testing) — these are different values, not
   just a different URL.
2. `lib/payments/*.ts` already switches API base URLs automatically based on
   `NODE_ENV === "production"` — no code change needed, just the env vars.
3. Place one real, small-value test order through each of the 5 payment
   methods (COD, bank transfer, JazzCash, Easypaisa, card) after deploying,
   before announcing launch. Confirm: the order lands in `/admin/orders`,
   the confirmation email arrives, and (for COD) the WhatsApp notification
   fires.
4. Confirm each provider's production webhook/postback URL is registered in
   their merchant portal pointing at `https://yamiriu.com/api/webhooks/...`
   — sandbox and production are often configured separately on their end.

---

## 5. 3D asset delivery (for your artist)

Full technical spec: [3D-ASSET-SPEC.md](3D-ASSET-SPEC.md).

**Current state:** avatars are placeholder capsule/sphere mannequins, and no
garment `.glb` files exist yet — the Outfit Builder falls back to 2D flat-lay
images gracefully, so the site is fully functional without them, but the
signature 3D feature won't look real until these land.

Hand your artist:
1. The spec doc (format, scale, origin, orientation, compression — glTF 2.0
   `.glb`, Draco or Meshopt compression accepted, human-scale meters, feet-
   centered origin).
2. The exact file paths expected: `public/models/avatars/{men,women,kids}.glb`
   for avatars, and whatever path you set as each product's `modelUrl` in
   `/admin/products` for garments (e.g. `/models/men/product-slug.glb` —
   upload via the admin product form's "3D model" field, 50MB max).
3. No code changes are needed on either side once files are dropped in —
   the loading/compression/fallback pipeline is already live.

---

## 6. Placeholder content to replace before launch

These are real, deployed strings/values that were written to make the site
functional during development — none of them are real:

| What | Where | Replace with |
|---|---|---|
| About page story copy | `app/(marketing)/about/page.tsx` | Your actual founding story — the current copy is plausible-sounding placeholder narrative, not real company history |
| About page hero image | Same file, uses `<Placeholder>` | A real studio/atelier photo |
| WhatsApp number | `lib/site-config.ts` (`WHATSAPP_NUMBER`) | Your real WhatsApp Business number, in the same `+92 3XX XXXXXXX` format |
| Social links | `lib/site-config.ts` (Instagram/TikTok/Facebook URLs) | Your real handles — currently point at `/yamiriu` handles that were never claimed |
| Terms of Service | `app/(marketing)/terms/page.tsx` | Have a lawyer review — current copy is a reasonable generic template, not legal advice |
| Privacy Policy | `app/(marketing)/privacy/page.tsx` | Same — review against actual data practices (what PostHog/Sentry/UploadThing store, retention periods) before publishing |
| Return/refund policy specifics | `app/(marketing)/returns/page.tsx` | Confirm the stated return window and courier-pickup process matches what you'll actually honor |
| Company address / registration details | Footer, Terms, Privacy | Add your real registered business address and CNIC/NTN if legally required for e-commerce in Pakistan |
| Product catalog | Currently 12 seed products (`db/seed-data.ts`) | Real inventory via `/admin/products` — the seed data is demo/dev content only, don't launch with it live |

---

## 7. Cron & uptime monitoring

- **Auto-cancel cron**: `vercel.json` schedules `/api/cron/cancel-stale-orders`
  hourly (`0 * * * *`). Vercel's Hobby tier only runs cron jobs once per day
  regardless of the schedule you set — if hourly cancellation matters,
  you'll need a Pro plan (or point an external scheduler like
  cron-job.org at the same URL with `Authorization: Bearer $CRON_SECRET`).
- **`/api/health`**: returns `200 {"status":"ok","db":"ok"}` when it can
  reach the database, `503` otherwise — point your uptime monitor here
  first, since it's the one endpoint that actually verifies DB connectivity
  rather than just "the server process is up."
- Set up uptime checks (UptimeRobot, Better Uptime, Checkly, or Vercel's own
  monitoring) against:
  - `https://yamiriu.com/` (homepage — catches full outages)
  - `https://yamiriu.com/shop` (catches DB/query-layer regressions)
  - `https://yamiriu.com/outfit-builder` (catches 3D-bundle/dynamic-import breakage)
  - `https://yamiriu.com/checkout` (catches auth/session regressions — this
    route requires a working DB + auth stack to render at all)
  - `https://yamiriu.com/api/health` (fastest, most direct DB-health signal
    — alert on this one first, the others are secondary confirmation)

---

## 8. Final pre-launch smoke test

Once everything above is done, in order:
1. Place one real order per payment method (§4).
2. Confirm PostHog is receiving events (Live Events view) and Sentry shows
   no unexpected errors from the smoke-test traffic.
3. Submit the sitemap (`https://yamiriu.com/sitemap.xml`) in Google Search
   Console and Bing Webmaster Tools.
4. Check `https://yamiriu.com/robots.txt` resolves and doesn't accidentally
   block anything you want indexed.
5. Confirm 2FA is on everywhere (§3) — do this last so you're not locked out
   of your own accounts mid-setup.

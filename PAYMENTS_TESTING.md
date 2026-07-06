# Payment provider sandbox testing

Yamiriu integrates three payment providers behind the common interface in
[`lib/payments/types.ts`](lib/payments/types.ts) (PRD Rule 4 — all
provider-specific code lives only in `lib/payments/*`). This doc explains how
to get sandbox credentials for each, which env vars to fill, and what to
double-check before going live.

## Before you start: known gaps

Each provider gates its complete API reference behind merchant/sandbox
account signup, so the exact field names and hash algorithms below were
implemented against the best publicly available documentation and
widely-used reference implementations — not a live test against each
provider's own sandbox. **Before processing a real transaction, place one
test order through each provider's sandbox and confirm:**

- JazzCash ([`lib/payments/jazzcash.ts`](lib/payments/jazzcash.ts)): the HCP
  field list, `pp_TxnType` value, and `pp_SecureHash` algorithm (sort field
  values alphabetically by key, prepend the integrity salt, HMAC-SHA256 with
  the integrity salt as the key). Also confirm the `pp_TxnRefNo` character
  rules — the implementation strips hyphens from the order number to be safe.
- Easypaisa ([`lib/payments/easypaisa.ts`](lib/payments/easypaisa.ts)): the
  request-side `merchantHashedReq` (AES/ECB/PKCS5Padding) is well documented,
  but Easypaisa's postback does **not** appear to carry a merchant-verifiable
  signature in publicly available docs. The webhook therefore treats the
  postback as advisory only and independently re-confirms via a
  server-to-server inquiry call before ever accepting it — confirm the
  inquiry endpoint path (`EASYPAISA_INQUIRY_URL` in the file) against the
  merchant portal documentation.
- PayFast ([`lib/payments/adapters/payfast.ts`](lib/payments/adapters/payfast.ts)):
  the two-step GetAccessToken → PostTransaction flow and sandbox host
  (`ipguat.apps.net.pk`) are documented; the `SIGNATURE` algorithm (HMAC-SHA256
  over sorted fields) is a best-effort mirror of PayFast's general documented
  pattern and the transaction-status inquiry endpoint name is unconfirmed.

If any of the above turns out to differ from the real sandbox, only the
single file listed needs to change — no caller outside `lib/payments/`
references these details directly.

## Getting sandbox credentials

### JazzCash

1. Sign up for a JazzCash merchant sandbox account at
   https://sandbox.jazzcash.com.pk/ (Merchant Onboarding).
2. Once approved, the sandbox dashboard provides:
   - **Merchant ID** → `JAZZCASH_MERCHANT_ID`
   - **Password** → `JAZZCASH_PASSWORD`
   - **Integrity Salt** (also called Hash Key) → `JAZZCASH_INTEGRITY_SALT`
3. In the sandbox dashboard, set the return URL to
   `https://<your-preview-domain>/api/payments/jazzcash/return` and the
   webhook/IPN URL (if configured separately) to
   `https://<your-preview-domain>/api/webhooks/jazzcash`.
4. Test cards/wallets for the sandbox are provided in the sandbox dashboard
   under "Test Credentials".

### Easypaisa

1. Register for an Easypay merchant account at
   https://easypay.easypaisa.com.pk/easypay-merchant/ (staging/UAT access is
   granted after onboarding).
2. From Account Settings, use "Generate Hashkey" to get your hash key:
   - **Store ID** → `EASYPAISA_STORE_ID`
   - **Hash Key** → `EASYPAISA_HASH_KEY`
3. Set the postBackURL in the merchant portal to
   `https://<your-preview-domain>/api/payments/easypaisa/return`, and if a
   separate server notification URL is configurable, point it at
   `https://<your-preview-domain>/api/webhooks/easypaisa`.

### PayFast (card gateway)

1. Sign up for a PayFast Pakistan merchant account (apps.net.pk /
   gopayfast.com). Sandbox/UAT access uses the `ipguat.apps.net.pk` host.
2. You'll receive:
   - **Merchant ID** → `PAYFAST_MERCHANT_ID`
   - **Secured Key** → `PAYFAST_SECURED_KEY`
3. Configure the success/failure URLs in the merchant portal (if
   configurable outside the request payload) to
   `https://<your-preview-domain>/api/payments/card-gateway/return` and the
   webhook URL to `https://<your-preview-domain>/api/webhooks/card-gateway`.

> The card gateway is deliberately isolated behind
> `lib/payments/adapters/payfast.ts` (PRD 2.4) — if the founders switch to
> HBL PayPlus or Bank Alfalah instead, write a new adapter file with the same
> exported shape and repoint the single import in `lib/payments/card.ts`.
> Nothing else in the codebase needs to change.

## Local dev without real credentials

All three `*_MERCHANT_ID`/`*_STORE_ID`/etc. env vars are optional
(`lib/env.ts`). With them unset, `initiatePayment` throws immediately;
`actions/checkout.ts` catches this, rolls back the just-created order
(restocking it), and returns a friendly "this payment method isn't available
right now" error — checkout remains fully testable with COD and bank
transfer without any provider configured (see the original checkout build).

## Testing the webhook flow once credentials are set

1. Place a test order through the sandbox hosted-checkout page for the
   provider you're testing.
2. Confirm the browser lands back on `/checkout/confirmation/[orderNumber]`
   (success) or `/checkout?paymentFailed=1` with the cart still intact
   (decline) — this is the return-URL handler
   (`app/api/payments/{provider}/return/route.ts`), which is UX-only.
3. Confirm the **webhook** actually flips the order from `pending_payment` to
   `confirmed` in the database — that's the authoritative path
   (`app/api/webhooks/{provider}/route.ts` → `lib/payments/webhook-handler.ts`).
   Check for the confirmation email (console-logged in dev if
   `RESEND_API_KEY` is unset) and an `order.status_changed` row in
   `audit_log`.
4. Replay the same webhook payload a second time (e.g. via `curl` against the
   sandbox's "resend webhook" feature, or by re-posting the same body) and
   confirm the order is **not** re-processed a second time — the response
   should come back with `{ "ok": true, "duplicate": true }` and no second
   audit log entry or email.
5. Trigger a declined/failed sandbox transaction and confirm the order is
   cancelled and its stock is restocked.

## Error reporting

Webhook signature failures, unknown-order references, and processing errors
all go through `lib/report-error.ts` (`reportError`), which is a placeholder
for Sentry (`console.error` for now, per PRD §13.1). Wiring real Sentry is a
separate task — swap that one function's body for
`Sentry.captureException(error, { extra: context })` and no caller needs to
change.

## Security notes (S-023, S-017)

- No webhook handler or return-URL handler ever logs the full raw payload —
  only order numbers, event ids, and response codes.
- All provider secrets (`JAZZCASH_PASSWORD`, `JAZZCASH_INTEGRITY_SALT`,
  `EASYPAISA_HASH_KEY`, `PAYFAST_SECURED_KEY`) are read server-side only via
  `lib/env.ts` — never sent to the client. The only thing the browser ever
  receives is the already-signed hosted-checkout form
  (`RedirectFormSpec.fields`), which is safe to expose since it's the exact
  payload that must be POSTed to the provider anyway.
- Signature comparisons use `crypto.timingSafeEqual` (constant-time) to avoid
  timing attacks.

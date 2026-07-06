# YAMIRIU.COM — PRODUCT REQUIREMENTS DOCUMENT

*Italian Clothing E-Commerce · 3D Outfit Builder · Website Edition · v1.0*

---

# SECTION 1 · PROJECT OVERVIEW

## 1.1 Product Summary

| Field | Value |
|---|---|
| Product Name | Yamiriu |
| Domain | yamiriu.com |
| Tagline | [ONE-LINE TAGLINE — e.g. "Italian style, made yours."] |
| Platform Type | E-commerce Website / Web App |
| Product Category | E-commerce — Fashion & Apparel |
| Founders | 2 co-founders (partners), plus employees with role-based admin access |
| Target Launch | [DATE — TBD] |
| Current Version | MVP 1.0 |
| Shipping Region | Pakistan only (launch), architecture supports future expansion |

## 1.2 Elevator Pitch

*[PLACEHOLDER — 2-3 sentences, non-technical. e.g. "Yamiriu is an Italian-inspired clothing brand for Pakistan, letting customers build and visualize full outfits on a 3D avatar before they buy."]*

## 1.3 Problem Statement

**The Problem:** *[PLACEHOLDER — who feels it, when, how does it affect them?]*

**The Solution:** Yamiriu combines Italian-style apparel with a 3D "build your own outfit" tool, letting customers mix tops, bottoms, shoes, and accessories on a customizable avatar (men/women/child) before adding items to cart — reducing guesswork and returns while making outfit-shopping visual and interactive.

## 1.4 Target Audience

**Primary User:** *[PLACEHOLDER — demographics, style/taste, income level, where they discover the brand — e.g. Instagram/TikTok]*

**Secondary User:** *[PLACEHOLDER if applicable]*

## 1.5 Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Advantage |
|---|---|---|---|
| [Competitor 1] | [Strengths] | [Weaknesses] | 3D outfit visualization, role-based ops, Pakistan-first payment/shipping |
| [Competitor 2] | [Strengths] | [Weaknesses] | [How we win] |
| [Competitor 3] | [Strengths] | [Weaknesses] | [How we win] |

## 1.6 Success Metrics (KPIs)

| Metric | Month 1 | Month 3 | Month 6 |
|---|---|---|---|
| Visitors | [X] | [X] | [X] |
| Orders | [X] | [X] | [X] |
| Outfit Builder Usage Rate (% sessions) | [X%] | [X%] | [X%] |
| Outfit Builder → Cart Conversion | [X%] | [X%] | [X%] |
| Cart Abandonment Rate | [X%] | [X%] | [X%] |
| Revenue | Rs [X] | Rs [X] | Rs [X] |
| LCP (Load Time) | <2.5s | <2.5s | <2.5s |
| Uptime | 99.9% | 99.9% | 99.9% |

---

# SECTION 2 · TECH STACK — E-COMMERCE / WEB APP

> Before writing any code, search the web for current latest stable versions of all dependencies listed below.

## 2.1 Core Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js App Router (latest stable) | SSR, SSG, ISR, edge runtime, Server Actions |
| Language | TypeScript — Strict Mode | `"strict": true`. Zero `any` types. |
| Styling | Tailwind CSS (latest stable) | Utility-first; CSS variables for theming |
| Package Manager | npm | Standard |
| Runtime | Node.js LTS | Latest LTS |

## 2.2 Backend & Database

| Layer | Technology | Notes |
|---|---|---|
| API Layer | Server Actions + API Routes | Server Actions for mutations; API Routes for webhooks (payments, couriers) |
| Database | PostgreSQL via Neon | Serverless Postgres; Neon branching per preview environment |
| ORM | Drizzle ORM | Type-safe, edge-compatible. Schema in `src/db/schema/` (one file per domain) |
| Validation | Zod | All Server Actions, API inputs, env vars, forms — validated server-side |
| Caching | Redis via Upstash | Rate limiting, caching, stock-count caching, background queues |

**Drizzle standards:** snake_case columns in DB, camelCase in TypeScript. Migrations via `drizzle-kit generate` + `drizzle-kit migrate` (never edit manually). Use `drizzle-zod` `createInsertSchema()` and `createSelectSchema()` on every table.

## 2.3 Authentication — NextAuth.js v5

> **Decision: NextAuth.js v5** (per founder requirement — overrides generic default).

- Credentials provider (email + password) for standard signup/login
- Optional social login (Google) for lower-friction signup
- Role-based session claims: `owner`, `admin`, `product_manager`, `order_fulfillment`, `support`, `customer`
- Session stored via JWT strategy with httpOnly Secure cookies
- Guest checkout supported in parallel with authenticated checkout (per founder requirement — customers are not forced to create an account, but authenticated users get order history, saved outfits, and wishlist)

## 2.4 Payments — Pakistan Market

| Method | Provider | Notes |
|---|---|---|
| JazzCash | JazzCash Merchant API | Mobile wallet — high adoption in Pakistan |
| Easypaisa | Easypaisa Merchant API | Mobile wallet — high adoption in Pakistan |
| Bank Transfer | Manual / IBFT | Order marked "pending payment confirmation" until admin verifies |
| Cash on Delivery (COD) | Internal | Flag high-risk COD orders (e.g. repeat no-shows) for admin review |
| Card Payments | **[DECISION NEEDED]** — local gateway (e.g. PayFast Pakistan, HBL PayPlus, Bank Alfalah Payment Gateway) | Stripe does not operate in Pakistan; a local PSP must be selected before Phase 1 build |

All payment integrations abstracted behind a `src/lib/payments/` service layer with a common interface (`initiatePayment`, `verifyPayment`, `handleWebhook`) so providers can be swapped without touching business logic.

## 2.5 Storage, Email & Images

| Layer | Technology | Notes |
|---|---|---|
| Email | Resend + React Email | Order confirmations, shipping updates, password reset — templates in `src/emails/` |
| File Uploads | UploadThing | Product images, 3D model files (`.glb`), customer review photos |
| WhatsApp Notifications | WhatsApp Business API (Cloud API) | Order confirmation, shipping updates, COD confirmation call-to-action |
| SMS (fallback) | Twilio or local SMS gateway | Order status for customers without WhatsApp |
| Images | `next/image` | Always used — zero raw `<img>` tags anywhere |

## 2.6 3D Outfit Builder Stack

| Layer | Technology | Notes |
|---|---|---|
| 3D Rendering | Three.js via `@react-three/fiber` + `@react-three/drei` | React-native 3D scene graph |
| Model Format | `.glb` (glTF binary) | Compressed with Draco or Meshopt |
| Avatar Base Models | 3 base rigs: Men, Women, Child | Generic/stylized, not user-body-customized (per founder decision) |
| Garment Models | One `.glb` per product (shirt, pants, shoes, accessory) | Uploaded per-product via admin panel; rigged to fit avatar skeleton |
| Interaction | Full 360° orbit controls (`OrbitControls` via drei) | Zoom + rotate enabled |
| Fallback for Low-End Devices | 2D "flat lay" image gallery | Auto-detect WebGL support / device capability; degrade gracefully — never block purchase |
| Loading Strategy | Lazy-load 3D bundle only when outfit builder is opened | Keeps initial page load fast (Rule: Core Web Vitals unaffected by 3D weight) |

**Outfit Builder Logic:**
- Categories selectable: Top, Bottom, Shoes, Accessory/Jacket
- Each category shows only products with an uploaded 3D model (`hasModel: true` flag)
- User selects avatar type (Men/Women/Child) → selects items per category → live preview updates on avatar
- "Add Outfit to Cart" adds each selected item as a **separate individual product line** (not a bundled SKU) — grouped visually in cart under an "Outfit" label so the customer sees what they styled together, but each item retains independent price, stock, and can be bought alone via normal PDP flow
- Outfits can be saved to the customer's account (if logged in) for later retrieval — not required to check out

## 2.7 Animation, State & Forms

| Layer | Technology | Notes |
|---|---|---|
| UI Animations | Framer Motion | Default for all React component animations |
| Scroll Animations | GSAP + ScrollTrigger | Lookbook/editorial scroll sequences only |
| Smooth Scroll | Lenis | Root layout. Never mixed with CSS `scroll-behavior: smooth` |
| Global State | Zustand | `src/stores/` — one store per domain (cart, outfit-builder, wishlist) |
| Server State | TanStack Query | All client-side async data, caching, background refetch |
| URL State | nuqs | Type-safe search params — filters, pagination, category tabs |
| Forms | React Hook Form + Zod | `zodResolver` for all forms |

## 2.8 Analytics, Monitoring & Deployment

| Layer | Technology | Notes |
|---|---|---|
| Product Analytics | PostHog | Events, funnels, session recordings, feature flags — day one |
| Error Monitoring | Sentry | Runtime errors, source maps, performance tracing — day one |
| Web Analytics | Vercel Analytics | Core Web Vitals, zero config |
| Uptime | Better Uptime (or placeholder equivalent) | HTTP checks every 1 min on production |
| Hosting | Vercel | Zero-config deploys from GitHub |
| CI/CD | Vercel GitHub Integration | Auto-deploy on main; preview on every PR; `drizzle-kit migrate` as build step |
| Courier Integration | TCS / Leopards / PostEx API | Order handoff, tracking number generation, delivery status webhook |

## 2.9 Environment Variables

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Yamiriu
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yamiriu.com
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
JAZZCASH_MERCHANT_ID=...
JAZZCASH_PASSWORD=...
JAZZCASH_INTEGRITY_SALT=...
EASYPAISA_STORE_ID=...
EASYPAISA_HASH_KEY=...
CARD_GATEWAY_API_KEY=...              # pending gateway selection
WHATSAPP_BUSINESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
COURIER_API_KEY=...                   # TCS / Leopards / PostEx
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=https://...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

# SECTION 3 · STRUCTURE & FOLDER LAYOUT

## 3.1 Route Groups

### Public Routes
`/`, `/about`, `/lookbook`, `/lookbook/[slug]`, `/size-guide`, `/faq`, `/contact`, `/returns`, `/track-order`, `/journal`, `/journal/[slug]`, `/for-men`, `/for-women`, `/for-kids`, `/shop`, `/shop/[category]`, `/product/[slug]`, `/outfit-builder`, `/cart`, `/terms`, `/privacy`

### Auth Routes
`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`

### Protected (Customer) Routes
`/account`, `/account/orders`, `/account/orders/[id]`, `/account/wishlist`, `/account/saved-outfits`, `/account/settings`, `/checkout`

### Admin Routes (Role-Gated)
`/admin`, `/admin/products`, `/admin/products/[id]`, `/admin/orders`, `/admin/orders/[id]`, `/admin/customers`, `/admin/discounts`, `/admin/outfit-assets`, `/admin/analytics`, `/admin/content`, `/admin/team` (manage employee roles), `/admin/gift-cards`

### API & System
`/api/webhooks/jazzcash`, `/api/webhooks/easypaisa`, `/api/webhooks/card-gateway`, `/api/webhooks/courier`, `/api/uploadthing`, `/api/og`, `/api/health`, `/sitemap.xml`, `/robots.txt`, `/feed.xml`

## 3.2 Folder Structure

```
src/app/
  (marketing)/layout.tsx, page.tsx, about/, lookbook/, lookbook/[slug]/,
    size-guide/, faq/, contact/, returns/, track-order/, journal/, journal/[slug]/,
    for-men/, for-women/, for-kids/
  (shop)/layout.tsx, shop/, shop/[category]/, product/[slug]/,
    outfit-builder/, cart/, checkout/
  (auth)/layout.tsx, sign-in/, sign-up/, forgot-password/, reset-password/
  (account)/layout.tsx, account/, account/orders/, account/orders/[id]/,
    account/wishlist/, account/saved-outfits/, account/settings/
  (admin)/layout.tsx, admin/, admin/products/, admin/orders/, admin/customers/,
    admin/discounts/, admin/outfit-assets/, admin/analytics/, admin/content/,
    admin/team/, admin/gift-cards/
  api/webhooks/jazzcash/route.ts, easypaisa/route.ts, card-gateway/route.ts,
    courier/route.ts, uploadthing/, og/route.tsx, health/route.ts
  layout.tsx, globals.css, not-found.tsx, error.tsx, sitemap.ts, robots.ts

src/components/
  ui/, layout/, marketing/, shop/, outfit-builder/, admin/, providers/

src/lib/
  utils.ts, animations.ts, validations.ts, constants.ts, payments/, courier/, rbac.ts

src/db/
  index.ts, schema/, migrations/

src/actions/, src/stores/, src/hooks/, src/emails/, src/types/
src/middleware.ts
```

---

# SECTION 4 · PAGES & CONTENT

## 4.1 Landing Page `/`

- **Navbar:** logo, category nav (Men/Women/Kids), Outfit Builder link (highlighted), account icon, cart icon with count, sticky blur, mobile hamburger
- **Hero:** editorial full-bleed image/video, H1, primary CTA "Shop New Arrivals," secondary CTA "Build Your Outfit"
- **Category Grid:** Men / Women / Kids entry cards
- **Outfit Builder Teaser:** short explainer + live 3D preview thumbnail + "Try It Now" CTA
- **Bestsellers carousel**
- **Lookbook preview:** 3-4 editorial looks linking to `/lookbook`
- **Brand story snippet** linking to `/about`
- **Newsletter signup**
- **Footer:** logo, nav columns, payment method icons, WhatsApp contact link, social links

## 4.2 Shop / Category `/shop/[category]`

- Filter sidebar: size, color, price range, availability
- Sort: newest, price low-high/high-low, bestselling
- Product grid with hover-swap image, quick-add to wishlist
- Pagination: cursor-based
- Empty state: "No products match your filters" + reset CTA

## 4.3 Product Detail Page `/product/[slug]`

- Image gallery (zoom on hover/tap)
- Name, price, color/size selectors, stock indicator
- "Add to Cart" primary CTA
- "Style This in the Outfit Builder" secondary CTA (deep-links into outfit builder with this item pre-selected, if it has a 3D model)
- Size guide link (opens modal)
- Customer reviews with photo uploads
- Related products (same category)
- Breadcrumbs + BreadcrumbList JSON-LD

## 4.4 Outfit Builder `/outfit-builder`

- **Avatar selector:** Men / Women / Child toggle at top
- **3D viewport:** center stage, full 360° orbit + zoom, loading skeleton while `.glb` assets stream in
- **Category tabs:** Top, Bottom, Shoes, Accessory/Jacket — each shows a horizontally scrollable list of eligible products (only those with `hasModel: true`)
- Selecting an item updates the avatar live
- **Fallback state:** if WebGL/device unsupported, render flat-lay 2D composite image builder instead (same selection UI, static preview image layered per category)
- **Actions:** "Save Outfit" (requires login — prompts sign-in if guest), "Add All to Cart" (adds each selected item as an individual cart line, grouped under an "Outfit" tag)
- **States:** loading (skeleton avatar + shimmering category chips), empty (no items selected yet — show default avatar), error (asset failed to load — retry button, never blocks entire page)
- SEO metadata: `noindex` not required (public, engaging page) — target keyword "custom outfit builder"

## 4.5 Cart `/cart`

- Line items grouped: individually-added items, and items grouped under "Outfit" labels (from outfit builder) with a small note "Styled together" but priced/removed independently
- Quantity adjust, remove item
- Discount code input
- Order summary: subtotal, shipping estimate, total
- COD notice if applicable (e.g., "COD available for orders under Rs [X]")

## 4.6 Checkout `/checkout`

- Guest or logged-in checkout
- Shipping address form (Pakistan address fields)
- Payment method selection: JazzCash, Easypaisa, Bank Transfer, COD, Card
- Order review + place order
- Order confirmation page + email + WhatsApp message triggered

## 4.7 Account Pages `/account/*`

- **Orders:** list + detail with status timeline (Pending → Confirmed → Shipped → Delivered), tracking number from courier
- **Wishlist:** saved products
- **Saved Outfits:** thumbnails of saved outfit-builder combinations, "Add to Cart" and "Edit in Builder" actions
- **Settings:** profile info, password change, address book

## 4.8 Admin Panel `/admin/*`

### 4.8.1 Dashboard `/admin`
- KPI cards: today's orders, revenue, low-stock alerts, outfit-builder conversion rate
- Recent orders feed
- Recent activity log

### 4.8.2 Products `/admin/products`
- CRUD: name, description, price, category, sizes, colors, images, stock per variant
- 3D model upload per product (`.glb`) + `hasModel` toggle for outfit builder eligibility
- Bulk actions: publish/unpublish, bulk price update

### 4.8.3 Orders `/admin/orders`
- Filter by status, payment method, date range
- Update order status, add tracking number, trigger courier handoff
- COD reconciliation view (flag repeat no-show customers)
- Refund/cancellation workflow

### 4.8.4 Customers `/admin/customers`
- Search, view order history per customer, flag/ban abusive accounts

### 4.8.5 Discounts `/admin/discounts`
- Create % or flat discount codes, expiry, min order value, usage limits

### 4.8.6 Outfit Builder Assets `/admin/outfit-assets`
- Manage which products have 3D models assigned
- Preview 3D model directly in admin before publishing

### 4.8.7 Analytics `/admin/analytics`
- Sales over time, best-sellers, outfit-builder usage funnel (opened → item selected → added to cart)

### 4.8.8 Content `/admin/content`
- Homepage banners, Lookbook entries, Journal (blog) posts

### 4.8.9 Team & Roles `/admin/team`
- Invite employees, assign roles: **Owner**, **Admin**, **Product Manager**, **Order Fulfillment**, **Support**
- Permission matrix editable per role (see Section 8.1)

### 4.8.10 Gift Cards `/admin/gift-cards`
- Issue, track balance, deactivate

---

# SECTION 5 · FEATURES & SYSTEM REQUIREMENTS

## 5.1 Functional Requirements

| ID | Requirement |
|---|---|
| FR-001 | All forms validate client-side (Zod + RHF) AND server-side (Zod in Server Actions/API routes) before any operation |
| FR-002 | All authenticated/admin routes redirect unauthenticated or unauthorized users, with role checked server-side |
| FR-003 | Cart and wishlist mutations use optimistic updates with automatic rollback on error |
| FR-004 | All lists/tables (products, orders, customers) use cursor-based pagination — no unbounded queries |
| FR-005 | All file uploads (images, `.glb` models, review photos) validate MIME type via magic bytes, file size, and permissions before storage |
| FR-006 | All external API calls (payments, courier, WhatsApp) handle rate limiting, retries with exponential backoff (max 3), and 10s timeouts |
| FR-007 | All user-facing errors show a friendly message — never expose raw errors, stack traces, or DB messages |
| FR-008 | Risky releases (e.g., new payment method, outfit-builder changes) gated behind PostHog feature flags |
| FR-009 | Outfit builder must degrade gracefully to 2D fallback on unsupported devices — purchase flow never blocked by 3D failure |
| FR-010 | Stock levels decrement atomically at order placement to prevent overselling on concurrent checkouts |
| FR-011 | COD orders flagged for manual review if customer has ≥2 prior undelivered/refused COD orders |

## 5.2 Non-Functional Requirements

| Requirement | Target |
|---|---|
| LCP (Load Time) | <2.5s (excluding lazy-loaded 3D viewer) |
| TTFB | <800ms |
| Layout Stability (CLS) | <0.1 |
| API Response (p95) | <500ms |
| 3D Asset Load (per model) | <3s on 4G |
| Uptime | 99.9% |
| Accessibility | WCAG 2.1 AA |
| TypeScript Coverage | 100% — no `any` types |

---

# SECTION 6 · USER WORKFLOWS

## 6.1 Authentication

### WF-001: New User Sign-Up
**Happy path:** Sign-up page → email+password or Google → client validation → server creates account → verification email sent → account created → redirected to account/home. **Errors:** email in use, weak password, email bounce (resend option), network error (form preserved).

### WF-002: Returning User Sign-In
**Happy path:** Credentials or Google → session created → redirect to intended page (or account home). **Errors:** wrong password 1-4 (attempts remaining), 5th (15-min lockout), account not found, unverified email + resend.

### WF-003: Password Reset
Email entry → same "check your email" response regardless of existence (prevents enumeration) → link expires 1 hour → new password set → all sessions invalidated.

## 6.2 Outfit Builder

### WF-004: Build & Save an Outfit
**Trigger:** Customer opens `/outfit-builder` or clicks "Style This" from a PDP.
**Happy path:** Select avatar type → select item per category (top/bottom/shoes/accessory) → live 3D preview updates → click "Save Outfit" → if guest, prompt sign-in/sign-up → outfit saved to account with thumbnail.
**Error paths:** 3D model fails to load (show fallback flat image for that item, log to Sentry, don't block other categories), WebGL unsupported (auto-switch to 2D flat-lay mode on page load), network drop mid-build (local state preserved via Zustand, retry on reconnect).
**Edge cases:** item goes out of stock while in an unsaved outfit (show "out of stock" badge on that item, allow swap); customer switches avatar type mid-build (previously selected items filtered to only those valid for new avatar type, others cleared with notice).

### WF-005: Outfit → Cart
**Trigger:** "Add All to Cart" from outfit builder.
**Happy path:** Each selected item validated for stock → added as individual cart line items, tagged with a shared `outfitId` for visual grouping in cart UI → toast confirmation → redirect option to cart or continue shopping.
**Errors:** one item out of stock (add the rest, notify which item failed and why), all items out of stock (block with clear message).

## 6.3 Shopping & Checkout

### WF-006: Browse to Purchase
Shop/category page → filter/sort → product detail → add to cart (with size/color selection required before enabling "Add to Cart") → cart review → checkout → payment method selection → order placed → confirmation page + email + WhatsApp message.

### WF-007: Checkout Payment Handling
- **JazzCash/Easypaisa:** redirect to provider → webhook confirms payment → order status updated to "Confirmed"
- **Bank Transfer:** order created as "Pending Payment Confirmation" → admin manually confirms after checking bank statement → status updated
- **COD:** order created as "Confirmed — COD," courier handoff triggered, no online payment step
- **Card:** redirect to gateway checkout → webhook confirms → order status updated
- **Errors:** payment declined (return to checkout with retry), webhook failure (idempotency key prevents duplicate order confirmation), customer abandons payment page (order remains "Pending," auto-cancelled after 24h if unconfirmed)

## 6.4 Order Fulfillment

### WF-008: Admin Fulfills Order
Order Fulfillment role views new orders → confirms stock → hands off to courier (TCS/Leopards/PostEx) via API → tracking number generated → customer notified via WhatsApp/email/SMS → order status auto-updates from courier webhook as it moves (Shipped → Out for Delivery → Delivered).

### WF-009: Returns & Refunds
Customer requests return via `/account/orders/[id]` or contact → Support role reviews → approve/deny → if approved, generate return instructions → on receipt, Order Fulfillment marks received → refund issued (original payment method or store credit) → status updated.

## 6.5 Account Management

### WF-010: Update Profile / Delete Account
Standard optimistic-update pattern for profile edits. Delete account → confirm dialog (type email) → cascade soft-delete → PII scrubbed immediately → order records retained (anonymized) for accounting/audit purposes.

---

# SECTION 7 · DATABASE SCHEMA

## 7.1 Schema Standards

- **Soft deletes:** `deletedAt` on all user-facing records (products, customers, orders never hard-deleted)
- **Timestamps:** `createdAt` and `updatedAt` on every table via `.$onUpdate(() => new Date())`
- **IDs:** `crypto.randomUUID()` via `.$defaultFn()`. Never expose auto-increment integers publicly
- **Slugs:** slugify all product/journal/lookbook slugs — lowercase, hyphens only
- **Type safety:** export inferred types via `typeof table.$inferSelect` / `$inferInsert` from every schema file

## 7.2 Core Schema (Drizzle ORM)

```ts
// src/db/schema/users.ts
import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const roleEnum = pgEnum('role', [
  'customer', 'owner', 'admin', 'product_manager', 'order_fulfillment', 'support'
]);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  role: roleEnum('role').default('customer').notNull(),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// src/db/schema/products.ts
export const categoryEnum = pgEnum('category', ['men', 'women', 'kids']);
export const itemTypeEnum = pgEnum('item_type', ['top', 'bottom', 'shoes', 'accessory', 'jacket']);

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  price: text('price').notNull(), // stored as decimal string, cast in app layer
  category: categoryEnum('category').notNull(),
  itemType: itemTypeEnum('item_type'),
  hasModel: boolean('has_model').default(false).notNull(),
  modelUrl: text('model_url'), // .glb file URL for outfit builder
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
});

// src/db/schema/product_variants.ts
export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id),
  size: text('size').notNull(),
  color: text('color').notNull(),
  stock: text('stock').notNull().default('0'),
  sku: text('sku').notNull().unique(),
});

// src/db/schema/orders.ts
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
]);
export const paymentMethodEnum = pgEnum('payment_method', [
  'jazzcash', 'easypaisa', 'bank_transfer', 'cod', 'card'
]);

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id), // nullable for guest checkout
  guestEmail: text('guest_email'),
  status: orderStatusEnum('status').default('pending_payment').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  total: text('total').notNull(),
  shippingAddress: text('shipping_address').notNull(), // JSON string
  trackingNumber: text('tracking_number'),
  courierProvider: text('courier_provider'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdate(() => new Date()),
});

// src/db/schema/order_items.ts
export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id),
  productVariantId: text('product_variant_id').notNull().references(() => productVariants.id),
  quantity: text('quantity').notNull(),
  priceAtPurchase: text('price_at_purchase').notNull(),
  outfitGroupId: text('outfit_group_id'), // nullable — links items styled together in outfit builder
});

// src/db/schema/saved_outfits.ts
export const savedOutfits = pgTable('saved_outfits', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  avatarType: categoryEnum('avatar_type').notNull(),
  name: text('name'),
  thumbnailUrl: text('thumbnail_url'),
  items: text('items').notNull(), // JSON array of productVariantIds
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// src/db/schema/discounts.ts
export const discounts = pgTable('discounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  type: text('type').notNull(), // 'percent' | 'flat'
  value: text('value').notNull(),
  minOrderValue: text('min_order_value'),
  expiresAt: timestamp('expires_at'),
  usageLimit: text('usage_limit'),
  usedCount: text('used_count').default('0'),
});
```

**Add domain models for reviews, gift cards, wishlists, journal posts, and lookbook entries following the same pattern.**

---

# SECTION 8 · SECURITY REQUIREMENTS

> **MANDATORY: Claude Code must implement EVERY item below. None are optional.**

## 8.1 Authentication & Authorization (Role-Based Access Control)

- **S-001:** All protected/admin routes enforced server-side — never rely solely on client-side redirects
- **S-002:** RBAC enforced on every Server Action and API Route — check role server-side before any privileged operation. Roles: `owner` (full access, manages team/roles), `admin` (full operational access, no team management), `product_manager` (products, outfit assets, discounts), `order_fulfillment` (orders, courier handoff, no product edits), `support` (customer view, returns/refunds, no product/order-financial edits), `customer` (own account only)
- **S-003:** Session tokens in httpOnly Secure SameSite=Strict cookies via NextAuth. Never localStorage
- **S-004:** JWT session with reasonable expiry + refresh; sign-out invalidates session
- **S-005:** Account lockout after 5 failed login attempts — 15-min temporary lock with exponential backoff
- **S-006:** Email enumeration prevention — same response whether email exists or not
- **S-007:** OAuth state parameter validation for Google sign-in — always verify to prevent CSRF
- **S-008:** "Sign out from all devices" for customer accounts

## 8.2 Input Validation & Injection Prevention

- **S-009:** Validate ALL user inputs with Zod server-side — never trust client-side validation alone
- **S-010:** Drizzle ORM parameterized queries exclusively — never concatenate user input into SQL
- **S-011:** Sanitize all rich text/HTML inputs (product descriptions, journal posts, reviews) with DOMPurify
- **S-012:** Validate file types server-side via MIME magic bytes for images, `.glb` models, and review photos — not just file extension
- **S-013:** Enforce text input max lengths at DB level AND application level (Zod `.max()`)
- **S-014:** Reject oversized payloads — 1MB for JSON bodies, 10MB for images, 50MB for `.glb` model uploads

## 8.3 API Security

- **S-015:** All API routes verify authentication before processing — return 401 for unauthenticated requests
- **S-016:** Rate limiting via Upstash Redis: auth 5 req/min per IP; general API 60 req/min per user; uploads 10 req/min per user; checkout 10 req/min per IP (bot/fraud mitigation)
- **S-017:** All payment webhooks (JazzCash, Easypaisa, card gateway) and courier webhooks must verify signatures — reject without valid signature
- **S-018:** Never expose secret keys in client-side code. All secrets in server-only env vars
- **S-019:** CORS: only allow trusted origins. Never `Access-Control-Allow-Origin: *` on authenticated endpoints
- **S-020:** Security headers in `next.config.ts`: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS `max-age=31536000; includeSubDomains`

## 8.4 Data Security & Privacy

- **S-021:** Hash all passwords with bcrypt (minimum 12 salt rounds) — never store plaintext
- **S-022:** Encrypt sensitive fields at rest (payment gateway tokens, courier API keys) using AES-256
- **S-023:** PII must never appear in logs, URLs, or analytics event properties (PostHog tracks user ID only, never email/name)
- **S-024:** Row-level security — customers can only read/write their own orders/wishlist/saved outfits. Admin roles scoped per Section 8.1
- **S-025:** All DB connections use SSL (`sslmode=require`)
- **S-026:** Data deletion requests: PII scrubbed immediately, order row retained (anonymized) for accounting, audit log retained
- **S-027:** Audit log: account creation/deletion, password change, role changes, order status changes, refunds, admin actions
- **S-028:** Never commit `.env` files. `.env*.local` in `.gitignore`. `.env.example` with placeholders only
- **S-029 (COD-specific):** COD fraud pattern detection — flag customers with ≥2 refused/undelivered COD orders for manual review before allowing further COD orders

## 8.5 Infrastructure & Pre-Launch Security Checklist

Enable 2FA on Vercel, GitHub, Neon, and all payment gateway/courier accounts. All production secrets in Vercel Environment Variables. Run `npm audit` in CI — block deploys on critical vulnerabilities. Enable Vercel DDoS protection.

| Check | Description |
|---|---|
| CHECK 1 | Unauthenticated request to all API routes returns 401 |
| CHECK 2 | Customer-role token on admin routes returns 403 |
| CHECK 3 | Role-scoped admin (e.g. Support) cannot access Product/Order-financial mutations |
| CHECK 4 | One customer cannot access another customer's orders/wishlist/saved outfits (IDOR test) |
| CHECK 5 | Rate limiting active on all public endpoints, especially checkout and auth |
| CHECK 6 | No secrets in client bundle (audit all `NEXT_PUBLIC_` vars) |
| CHECK 7 | Payment and courier webhook handlers reject invalid signatures |
| CHECK 8 | `npm audit` shows zero critical vulnerabilities |

---

# SECTION 9 · SEO & DISCOVERY

> **MANDATORY. SEO is distributed across all implementation prompts starting at Prompt 1.**

## 9.1 Technical SEO

- Every page: unique title (50-60 chars) and meta description (150-160 chars) via Next.js Metadata API
- Canonical URLs via `alternates.canonical`
- Dynamic `sitemap.xml` via `app/sitemap.ts` — includes products, journal posts, lookbook entries
- `robots.ts`: disallow `/admin/`, `/account/`, `/api/`, `/checkout`, `/sign-in`, `/sign-up`
- Core Web Vitals: LCP <2.5s, CLS <0.1 (3D outfit builder lazy-loaded, never blocks initial paint)

## 9.2 On-Page SEO

- Every page has exactly one H1 with primary keyword
- All product/lookbook images: descriptive alt text
- Internal linking — every page links to 2-3 others with descriptive anchor text
- Journal posts: author, publish date, category, related posts
- Breadcrumbs on all nested pages (visible UI + BreadcrumbList JSON-LD)

## 9.3 Target Keywords (Draft — Refine Pre-Launch)

| Page | Primary Keyword |
|---|---|
| Homepage | "Italian clothing brand Pakistan" |
| /for-men | "Italian men's clothing Pakistan" |
| /for-women | "Italian women's clothing Pakistan" |
| /for-kids | "Italian kids clothing Pakistan" |
| /outfit-builder | "custom outfit builder online" |
| /journal/* | style/outfit-inspiration long-tail terms |

## 9.4 Structured Data (JSON-LD)

- `WebSite` schema (root layout)
- `Organization` schema (homepage)
- `BreadcrumbList` (every inner page)
- `Product` schema (product detail pages — price, availability, ratings)
- `Article` schema (journal posts)
- `FAQPage` (FAQ page)
- `AggregateRating` (products with reviews)

## 9.5 Open Graph & Social

All pages: `og:title`, `og:description`, `og:image` (1200×630px via `/api/og`), `og:url`, `og:type`. `twitter:card` summary_large_image.

---

# SECTION 10 · UI/UX RULES & STANDARDS

> **NON-NEGOTIABLE: Apply to EVERY component.**

## 10.1 Core Design Principles

- **Clarity over cleverness:** one clear primary action per screen
- **Progressive disclosure:** outfit builder reveals categories one at a time, not all at once
- **Consistency:** same patterns, same components throughout
- **Feedback:** every action (add to cart, save outfit, apply discount) produces immediate visual response
- **Forgiveness:** confirm destructive actions (delete account, remove outfit), preserve cart/form data on errors

## 10.2 Brand Aesthetic — Minimal Luxury Italian

- **Palette:** cream/off-white base, black, terracotta, olive, muted gold/brass accent
- **Typography:** serif display font for headings (editorial, fashion-house feel), clean sans-serif for body
- **Photography-led:** large, high-quality imagery over heavy decoration
- Dark/light mode: light mode as primary brand experience; dark mode optional secondary
- Type scale: display, heading, body, small, caption. Body line height 1.5-1.6
- Never below 14px body text. WCAG AA contrast (4.5:1 normal, 3:1 large)

## 10.3 E-commerce-Specific UI Rules

- Tailwind spacing scale exclusively. Max content width `max-w-7xl`
- Section padding `py-16` mobile, `py-24` desktop
- Mobile-first breakpoints — majority of Pakistani e-commerce traffic is mobile
- Product grid: 2 columns mobile, 3-4 desktop
- Sticky "Add to Cart" bar on mobile PDP when scrolled past main CTA

## 10.4 Component Standards

### Buttons
Primary (filled, high contrast, ONE per screen for main CTA), Secondary (outlined/ghost), Destructive (red). Loading state with spinner. Min 44px touch target.

### Forms
React Hook Form + Zod. Labels always visible. Inline validation after blur. Errors below field in red, specific and actionable.

### Loading States
Skeleton screens for product grids and order lists. Dedicated 3D-loading skeleton (silhouette placeholder) for outfit builder while `.glb` assets stream.

### Empty States
Icon + headline + description + primary CTA (e.g., empty wishlist → "Nothing saved yet" + "Browse Products" CTA).

### Toasts / Alerts
Sonner. Success: green, 3s. Error: red, 5s. Max 3 stacked.

## 10.5 Animation Rules

- Framer Motion for all UI animations
- GSAP + ScrollTrigger for lookbook/editorial scroll sequences only
- Lenis for smooth scroll in root layout
- Always respect `prefers-reduced-motion`
- Only animate `transform` and `opacity` for 60fps
- 3D avatar rotation: smooth damped orbit controls, no jarring snaps

## 10.6 Accessibility

- WCAG 2.1 AA. Focus management, ARIA labels throughout, especially on outfit builder category tabs and 3D controls (provide non-visual alternative description of selected outfit for screen readers)
- Semantic HTML, skip link, visible focus ring
- Never use `div` as button. Confirmation for all destructive actions

## 10.7 Performance UX

- Optimistic updates on cart/wishlist mutations with rollback on error
- Skeleton screens everywhere async data loads
- 300ms debounce on all search/filter inputs
- Cursor-based pagination for all lists
- 3D assets: lazy-loaded, compressed, cached client-side after first load per session

---

# SECTION 11 · UNIVERSAL BUILD RULES

| # | Rule | Description |
|---|---|---|
| 1 | Latest Versions | Search web for current latest stable versions of all dependencies before coding |
| 2 | Server Actions for Mutations | Server Actions for cart/checkout/admin mutations. API Routes for webhooks only |
| 3 | UTC Dates | All dates stored as UTC. Displayed in Pakistan Standard Time (or user local) |
| 4 | Abstract Third-Party Services | Wrap payments, courier, WhatsApp behind `src/lib/` service layers |
| 5 | No Secrets in Client Bundle | Never prefix sensitive keys with `NEXT_PUBLIC_`. Audit before launch |
| 6 | Zod Everywhere | Validate every Server Action, API route, and env var at startup |
| 7 | ORM Only for DB Access | All DB access via Drizzle. Raw SQL only via parameterized `sql\`\`` |
| 8 | Soft Deletes | Never hard-delete user/order/product records |
| 9 | Images Optimized | `next/image` everywhere, zero raw `img` tags |
| 10 | Slugs Not IDs in URLs | Never expose internal DB IDs in product/journal URLs |
| 11 | Named Imports Only | Enable tree-shaking |
| 12 | Role Checked Twice | Check role in `middleware.ts` AND inside the Server Action/API handler |
| 13 | nuqs for URL State | All filters/pagination/tabs via nuqs |
| 14 | Feature Flags for Risky Releases | PostHog flags for new payment methods, outfit-builder changes |
| 15 | TanStack Query for Client Fetching | Never `useEffect` + `fetch` for cacheable data |
| 16 | Auth Storage | httpOnly cookies only via NextAuth. Never localStorage for tokens |
| 17 | 3D Never Blocks Purchase | Outfit builder failures must never prevent normal add-to-cart/checkout flows |

---

# SECTION 12 · IMPLEMENTATION CHECKLIST

*30-50 execution prompts typical. Split this PRD accordingly when handing to Claude Code.*

## Phase 1 — Foundation
- Search web for latest stable dependency versions
- Initialize project: TypeScript strict + npm + Tailwind
- Set up folder structure (Section 3)
- Configure environment variables (Section 2)
- Initialize Drizzle + initial migration (Section 7)
- Set up NextAuth.js v5 — credentials + Google provider, RBAC middleware
- Set up Sentry, PostHog
- Set up payment service layer scaffolding (JazzCash, Easypaisa, bank transfer, COD, card gateway placeholder)
- Set up Resend — order confirmation email template
- Set up UploadThing — image + `.glb` upload routes with validation
- Set up WhatsApp Business API integration
- Create `/api/health` route
- Apply Section D BLOCK 01 (metadata, security headers, robots)

## Phase 2 — Core Pages & Layouts
- Root layout, marketing layout (Navbar/Footer), shop layout, account layout, admin layout
- Landing page — all sections (4.1)
- Shop/category, product detail pages
- Sign-in/Sign-up/Forgot Password
- Apply Section D BLOCK 03 (metadata per route), BLOCK 04 (OG image route)

## Phase 3 — Outfit Builder (Core Differentiator)
- Three.js/`@react-three/fiber` scene setup with avatar base models (men/women/child)
- Garment `.glb` loading + attach-to-avatar logic
- Category selector UI, live preview updates
- 2D fallback flat-lay mode with device/WebGL detection
- Save outfit to account, outfit → cart grouping logic
- Apply Section D BLOCK 07 (Core Web Vitals — ensure 3D lazy-loads)

## Phase 4 — Shopping & Checkout
- Cart page with outfit grouping display
- Checkout flow: address form, payment method selection
- JazzCash, Easypaisa, bank transfer, COD, card gateway integrations + webhooks
- Order confirmation page/email/WhatsApp trigger
- Courier API integration (TCS/Leopards/PostEx) + tracking webhook

## Phase 5 — Account Features
- Order history + tracking display
- Wishlist, Saved Outfits
- Profile settings, address book

## Phase 6 — Admin Panel
- Dashboard with KPIs
- Products CRUD + 3D model upload/assignment
- Orders management + fulfillment workflow
- Customers, Discounts, Gift Cards
- Team & Roles (RBAC management UI)
- Analytics (sales + outfit-builder funnel)
- Content management (banners, lookbook, journal)

## Phase 7 — Polish & Launch Prep
- Skeleton screens for every async section, error boundaries
- Mobile responsive pass — all breakpoints
- Accessibility audit
- Apply Section D BLOCK 02 (sitemap), BLOCK 05 (JSON-LD), BLOCK 08 (internal linking), BLOCK 11 (final SEO verification)
- Run Section 8 security checklist + `npm audit`
- Load-test checkout flow and outfit builder under concurrent stock updates
- Smoke test on production URL before announcing launch

---

# SECTION 13 · MONITORING & ALERTING

> **MANDATORY: configured before launch.**

## 13.1 Error Monitoring — Sentry
- Client + server configs + source maps installed day one
- Alert immediately when error rate exceeds 1% of sessions in any rolling 1-hour window
- Alert channel: **[PLACEHOLDER — Slack channel or email]**
- Special watch: outfit-builder 3D asset load failures, payment webhook failures

## 13.2 Uptime Monitoring
- HTTP checks every 1 minute on `/`, `/shop`, `/outfit-builder`, `/checkout`, `/api/health`
- Alert channel: **[PLACEHOLDER]**

```
// /api/health should return:
{ status: "ok", db: "ok", ts: new Date().toISOString() }
```

## 13.3 PostHog Analytics

### Key Events
`user_signed_up`, `user_signed_in`, `product_viewed`, `add_to_cart`, `outfit_builder_opened`, `outfit_item_selected`, `outfit_saved`, `outfit_added_to_cart`, `checkout_started`, `order_placed`, `payment_method_selected`

### Rules
- **PII rule:** never track email, name, or address — user ID only
- **Feature flags:** for new payment methods and outfit-builder changes
- **Session recordings:** enabled on checkout and outfit-builder flows
- **Funnels:** outfit-builder opened → item selected → added to cart → order placed

---

# SECTION 14 · GIT WORKFLOW & DEPLOYMENT

## 14.1 Branch Strategy

| Branch | Purpose | Deploys To |
|---|---|---|
| main | Production — always deployable | Production (Vercel) |
| develop | Integration branch | Staging (Vercel preview) |
| feature/* | Individual features/fixes | Per-PR Vercel preview |
| hotfix/* | Critical production fixes | Merges directly to main + develop |

## 14.2 Commit Conventions

Conventional Commits: `type(scope): description` — e.g. `feat(outfit-builder): add 3D model lazy loading`, `fix(checkout): jazzcash webhook signature validation`.

## 14.3 Pull Request Requirements

- PR title in Conventional Commits format
- Description: what changed, why, how to test
- Required checks: no TypeScript errors, no ESLint errors, `npm audit` clean
- At least 1 approval required (partner review)
- No direct pushes to main

## 14.4 Deployment

- Every PR triggers Vercel preview
- Merge to main triggers production deploy
- `drizzle-kit migrate` as build step
- Rollback via Vercel instant rollback
- Smoke test `/` and `/api/health` after every production deploy

---

# SECTION 15 · KNOWN CONSTRAINTS & AGENT NOTES

| Type | Value |
|---|---|
| Platform | E-commerce Website / Web App |
| Constraint 1 | Card payment gateway not yet selected — Stripe unavailable in Pakistan; must resolve before Phase 4 build |
| Constraint 2 | Shipping restricted to Pakistan only at launch |
| Constraint 3 | 3D models must be sourced/created per SKU — content pipeline dependency, may bottleneck outfit-builder catalog growth |
| Constraint 4 | [Add any additional project-specific constraint] |
| Note 1 | Two founding partners share top-level access; RBAC system must support additional employee roles from day one, not bolted on later |
| Note 2 | Outfit builder is the core differentiator — do not let its complexity delay shipping the base e-commerce flow; ship products/cart/checkout first, layer in 3D builder in Phase 3 |

---

*PRD created for AI-agent development. Do not convert sections to prose — use as direct agent prompts. Split into 30-50 execution prompts using Section 12 as your guide. Distribute Section D SEO commands across prompts — SEO starts at Prompt 1, not at the end.*

# SECTION D · SEO AGENT COMMANDS

## BLOCK 01 — Project Init (Prompt 1) — MANDATORY
Set `metadataBase` with production domain (yamiriu.com). Title template `'%s | Yamiriu'`. Set description, `openGraph` (type website, locale en_PK or en_US, siteName "Yamiriu", default OG image via `/api/og`). Twitter card `summary_large_image`. Security headers in `next.config.ts`: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy. `robots.ts`: block `/admin`, `/account`, `/api/`, `/checkout`, `/sign-in`, `/sign-up`. Fonts via `next/font` only.

## BLOCK 02 — Sitemap — MANDATORY
`app/sitemap.ts`: query DB for all published products, journal posts, lookbook entries with slugs and `updatedAt`. Homepage priority 1.0, category/product pages 0.8-0.9, journal 0.5-0.7. Exclude auth, account, admin, API routes.

## BLOCK 03 — Page Metadata — MANDATORY
Static pages: `metadata` export with title, description, canonical. Dynamic pages (`/product/[slug]`, `/journal/[slug]`): `generateMetadata`, `notFound()` if missing. Public pages indexed; account/admin/checkout `index: false, follow: false`.

## BLOCK 04 — OG Image Generation — MANDATORY
`app/api/og/route.tsx` using `ImageResponse`, 1200×630px, `runtime='edge'`. Accept `title`, `description`, `type` params. Brand palette (cream/black/terracotta) background, embed logo.

## BLOCK 05 — Structured Data — MANDATORY
`WebSite` (root), `Organization` (homepage), `BreadcrumbList` (inner pages), `Product` (PDPs — price/availability/rating), `Article` (journal), `FAQPage` (FAQ page), `AggregateRating` (reviewed products).

## BLOCK 06 — URL Enforcement
Lowercase, hyphenated slugs everywhere. `generateStaticParams` for known products. `notFound()` on missing DB records (404, not 200). Never expose DB IDs in URLs.

## BLOCK 07 — Core Web Vitals — MANDATORY
`next/image` everywhere — zero raw `<img>`. Dynamic imports + skeleton for below-fold and all 3D outfit-builder components (must not affect homepage/product-page LCP). PostHog/Sentry via `Script strategy='afterInteractive'`.

## BLOCK 08 — Internal Linking
Every page reachable within 3 clicks from homepage. `next/link` everywhere, descriptive anchor text. Breadcrumbs on inner pages. Journal: related posts at bottom.

## BLOCK 09 — SEO Content Pages
Journal RSS at `/feed.xml`. Audience landing pages: `/for-men`, `/for-women`, `/for-kids`.

## BLOCK 10 — Analytics
PostHog via `Script strategy='afterInteractive'`. Track pageview (full URL + referrer), UTM source, scroll depth on landing/lookbook pages, all CTA clicks, outfit-builder funnel events (Section 13.3).

## BLOCK 11 — Final Verification (last prompt) — MANDATORY
- VERIFY `/sitemap.xml`: all public URLs present, zero auth/admin/api routes
- VERIFY `/robots.txt`: blocks correctly, does not block CSS/JS
- VERIFY page source of homepage + one product page: meta, canonical, `og:image`, JSON-LD visible in raw HTML
- VERIFY Google Rich Results Test: zero errors
- VERIFY PageSpeed Insights: LCP <2.5s, CLS <0.1, INP <200ms (test both with and without opening outfit builder)
- VERIFY all images have non-empty alt text
- OUTPUT: SEO Implementation Report

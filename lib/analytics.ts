import posthog from "posthog-js";
import { logAnalyticsEvent } from "@/actions/analytics";

/**
 * PostHog wiring (PRD 2.8 / 13.3). Client-only — safe to call from server
 * code too (no-ops there) so callers never need an environment check.
 *
 * PII rule (S-023): never pass email, name, or address — user id only.
 */
export type AnalyticsEvent =
  | "cta_click"
  | "newsletter_signup"
  | "product_viewed"
  | "add_to_cart"
  | "outfit_builder_opened"
  | "outfit_item_selected"
  | "outfit_saved"
  | "outfit_added_to_cart"
  | "checkout_started"
  | "order_placed"
  | "scroll_depth";

let initialized = false;

// Only these events feed the local /admin/analytics funnel proxy — avoid a
// wasted server-action round trip for every pageview/scroll/CTA event too.
const LOCALLY_TRACKED_EVENTS = new Set(["outfit_builder_opened", "outfit_item_selected", "outfit_added_to_cart"]);

/** Called once from AnalyticsProvider. No-ops if no key is configured. */
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
    // Session recordings only on checkout + outfit-builder (PRD 13.3) — this
    // project doesn't self-host, so recordings stay opt-in per project
    // settings in the PostHog dashboard rather than a per-page toggle here.
  });
  initialized = true;
}

export function capture(
  event: AnalyticsEvent | string,
  properties?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;

  // Dual-fired (non-blocking, fire-and-forget) so /admin/analytics can
  // compute the outfit-builder funnel locally — see actions/analytics.ts.
  if (LOCALLY_TRACKED_EVENTS.has(event)) {
    void logAnalyticsEvent(event).catch(() => {});
  }

  if (!initialized) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[analytics] ${event}`, properties ?? {});
    }
    return;
  }
  posthog.capture(event, properties);
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Registers any UTM params present on the current URL as PostHog "super
 * properties" (persisted for the rest of the session/until overwritten), so
 * later funnel events (checkout_started, order_placed) carry the same
 * acquisition attribution without re-reading the URL each time. No-ops if
 * none of the UTM keys are present — never overwrites with empty values. */
export function registerUtmProperties(searchParams: URLSearchParams): void {
  if (typeof window === "undefined" || !initialized) return;
  const props: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = searchParams.get(key);
    if (value) props[key] = value;
  }
  if (Object.keys(props).length > 0) {
    posthog.register(props);
  }
}

/** Pageview capture with referrer (BLOCK 10) — `capture_pageview: false` in
 * initAnalytics() disables PostHog's own auto-capture so this is the single
 * source of pageview events, fired manually on each route change. */
export function capturePageview(url: string): void {
  if (typeof window === "undefined") return;
  capture("$pageview", {
    $current_url: url,
    referrer: document.referrer || "",
  });
}

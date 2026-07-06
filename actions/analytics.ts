"use server";

import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

const TRACKED_EVENTS = new Set(["outfit_builder_opened", "outfit_item_selected", "outfit_added_to_cart"]);

/**
 * Lightweight, best-effort local counter dual-fired alongside PostHog
 * (lib/analytics.ts) purely so /admin/analytics can compute the
 * outfit-builder funnel without a PostHog query API integration. Never
 * throws — a dropped analytics event must never break the UI.
 */
export async function logAnalyticsEvent(event: string): Promise<void> {
  if (!TRACKED_EVENTS.has(event)) return;
  try {
    await db.insert(analyticsEvents).values({ event: event as "outfit_builder_opened" | "outfit_item_selected" | "outfit_added_to_cart" });
  } catch (error) {
    console.error("[analytics] failed to log event", event, error);
  }
}

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * Lightweight, append-only local counter for the outfit-builder funnel
 * (PRD 4.8.10). PostHog remains the source of truth for full event
 * analysis — this table exists only because the admin dashboard has no
 * PostHog query API access configured, so the three pre-order funnel steps
 * are dual-fired here (see components/outfit-builder/outfit-builder-page-client.tsx)
 * purely so /admin/analytics can compute a same-database funnel percentage.
 * Never stores PII (S-023) — event name + timestamp only.
 */
export const analyticsEventNameEnum = pgEnum("analytics_event_name", [
  "outfit_builder_opened",
  "outfit_item_selected",
  "outfit_added_to_cart",
]);

export const analyticsEvents = pgTable("analytics_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  event: analyticsEventNameEnum("event").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents);
export const selectAnalyticsEventSchema = createSelectSchema(analyticsEvents);
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders } from "./orders";

export const paymentProviderEnum = pgEnum("payment_provider", [
  "jazzcash",
  "easypaisa",
  "card_gateway",
]);

/**
 * Idempotency ledger for payment webhooks (S-017). `id` is deterministic —
 * `${provider}:${providerEventId}` — so a duplicate delivery of the same
 * event collides on the primary key and can be detected with a single
 * INSERT ... ON CONFLICT DO NOTHING, atomically, without a separate
 * read-then-write race window.
 */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: paymentProviderEnum("provider").notNull(),
  orderId: text("order_id").references(() => orders.id),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents);
export const selectWebhookEventSchema = createSelectSchema(webhookEvents);
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders } from "./orders";

export const courierProviderEnum = pgEnum("courier_provider_name", ["postex"]);

/**
 * Idempotency ledger for courier delivery webhooks (S-017), mirroring
 * lib/payments/webhook-idempotency.ts's `webhook_events` pattern exactly —
 * kept as a separate table/enum rather than widening `payment_provider`
 * since couriers are a distinct third-party domain from payment gateways
 * (PRD Rule 4). `id` is deterministic (`${provider}:${eventId}`).
 */
export const courierWebhookEvents = pgTable("courier_webhook_events", {
  id: text("id").primaryKey(),
  provider: courierProviderEnum("provider").notNull(),
  orderId: text("order_id").references(() => orders.id),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
});

export const insertCourierWebhookEventSchema = createInsertSchema(courierWebhookEvents);
export const selectCourierWebhookEventSchema = createSelectSchema(courierWebhookEvents);
export type CourierWebhookEvent = typeof courierWebhookEvents.$inferSelect;
export type NewCourierWebhookEvent = typeof courierWebhookEvents.$inferInsert;

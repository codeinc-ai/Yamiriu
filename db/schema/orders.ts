import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { generateOrderNumber } from "@/lib/order-number";

export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  // Awaiting admin approval instead of auto-confirming — e.g. a COD order
  // from a customer/phone with prior refused/undelivered COD orders (S-029).
  "pending_review",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "jazzcash",
  "easypaisa",
  "bank_transfer",
  "cod",
  "card",
]);

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // Public, human-readable identifier for track-order lookups — the internal
  // UUID `id` above is never exposed to customers (PRD Rule 10).
  orderNumber: text("order_number")
    .notNull()
    .unique()
    .$defaultFn(() => generateOrderNumber()),
  userId: text("user_id").references(() => users.id),
  guestEmail: text("guest_email"),
  status: orderStatusEnum("status").default("pending_payment").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),

  // Price breakdown, persisted at order time so the confirmation page/email
  // and later admin views can reconstruct exactly what the customer saw —
  // never recomputed from current (possibly since-changed) catalog prices.
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountCode: text("discount_code"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  giftCardCode: text("gift_card_code"),
  giftCardAmount: numeric("gift_card_amount", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  shippingCost: numeric("shipping_cost", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),

  shippingAddress: jsonb("shipping_address").notNull(),
  // Denormalized from shippingAddress for fast COD-risk lookups (S-029) and
  // future admin filtering (PRD 4.8.3) without querying into the JSON blob.
  customerPhone: text("customer_phone").notNull(),
  // Set by (future) fulfillment/courier logic when a COD delivery is refused
  // or comes back undelivered. Read here by the COD fraud check; checkout
  // itself never sets this true on a newly created order.
  codRefused: boolean("cod_refused").default(false).notNull(),

  // The payment gateway's own transaction id, set once a webhook confirms
  // or declines payment — for admin reconciliation/support lookups only,
  // never used as an idempotency key (webhook_events handles that).
  providerTransactionId: text("provider_transaction_id"),

  trackingNumber: text("tracking_number"),
  courierProvider: text("courier_provider"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { orders } from "./orders";

export const returnStatusEnum = pgEnum("return_status", [
  "pending",
  "approved",
  "denied",
  "received",
  "refunded",
]);

export const refundMethodEnum = pgEnum("refund_method", ["original_payment", "store_credit"]);

/**
 * Customer-initiated return requests on delivered orders (PRD WF-009).
 * Support reviews pending requests; Order Fulfillment marks received once
 * the item is back; a refund is then issued and the status closes out.
 * Building the Support/Fulfillment review UI itself is a separate,
 * admin-side task — this schema plus the customer-facing "Request Return"
 * action are in scope here.
 */
export const returnRequests = pgTable("return_requests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
  status: returnStatusEnum("status").default("pending").notNull(),
  refundMethod: refundMethodEnum("refund_method"),
  returnInstructions: text("return_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertReturnRequestSchema = createInsertSchema(returnRequests);
export const selectReturnRequestSchema = createSelectSchema(returnRequests);
export type ReturnRequest = typeof returnRequests.$inferSelect;
export type NewReturnRequest = typeof returnRequests.$inferInsert;

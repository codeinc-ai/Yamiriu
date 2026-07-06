import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const roleEnum = pgEnum("role", [
  "customer",
  "owner",
  "admin",
  "product_manager",
  "order_fulfillment",
  "support",
]);

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: roleEnum("role").default("customer").notNull(),
  // Blocks sign-in and checkout for customers (admin ban) and sign-in for
  // staff (team deactivation) — same underlying mechanism, PRD 4.8.4/4.8.7.
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: timestamp("email_verified"),
  // Stateless "sign out everywhere" / password-reset invalidation anchor:
  // any JWT issued before this instant is rejected (S-004, S-008).
  sessionsValidFrom: timestamp("sessions_valid_from").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

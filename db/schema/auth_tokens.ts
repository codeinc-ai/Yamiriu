import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

/**
 * Single-use, hashed tokens for email verification.
 * We store only a SHA-256 hash of the token; the raw token lives solely in the
 * emailed link, so a DB leak cannot be used to verify accounts.
 */
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("evt_user_id_idx").on(table.userId)]
);

export const insertEmailVerificationTokenSchema = createInsertSchema(
  emailVerificationTokens
);
export const selectEmailVerificationTokenSchema = createSelectSchema(
  emailVerificationTokens
);
export type EmailVerificationToken =
  typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken =
  typeof emailVerificationTokens.$inferInsert;

/**
 * Single-use, hashed tokens for password resets. Expire after 1 hour (WF-003).
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("prt_user_id_idx").on(table.userId)]
);

export const insertPasswordResetTokenSchema =
  createInsertSchema(passwordResetTokens);
export const selectPasswordResetTokenSchema =
  createSelectSchema(passwordResetTokens);
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;

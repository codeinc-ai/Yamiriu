import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { roleEnum } from "./users";

/**
 * Pending staff invitations (PRD 4.8.5, owner-only). Mirrors
 * email_verification_tokens' hashed-token pattern — only a SHA-256 hash is
 * stored, the raw token exists solely in the emailed link. The invited
 * person has no `users` row yet, so email + intended role are carried here
 * until the invite is accepted (a new user is created with that role).
 */
export const teamInvites = pgTable(
  "team_invites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    invitedByUserId: text("invited_by_user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("team_invites_email_idx").on(table.email)]
);

export const insertTeamInviteSchema = createInsertSchema(teamInvites);
export const selectTeamInviteSchema = createSelectSchema(teamInvites);
export type TeamInvite = typeof teamInvites.$inferSelect;
export type NewTeamInvite = typeof teamInvites.$inferInsert;

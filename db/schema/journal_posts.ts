import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";

export const journalPosts = pgTable("journal_posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id),
  category: text("category"),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertJournalPostSchema = createInsertSchema(journalPosts);
export const selectJournalPostSchema = createSelectSchema(journalPosts);
export type JournalPost = typeof journalPosts.$inferSelect;
export type NewJournalPost = typeof journalPosts.$inferInsert;

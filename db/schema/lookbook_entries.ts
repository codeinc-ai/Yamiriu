import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const lookbookEntries = pgTable("lookbook_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  relatedProductIds: jsonb("related_product_ids"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertLookbookEntrySchema = createInsertSchema(lookbookEntries);
export const selectLookbookEntrySchema = createSelectSchema(lookbookEntries);
export type LookbookEntry = typeof lookbookEntries.$inferSelect;
export type NewLookbookEntry = typeof lookbookEntries.$inferInsert;

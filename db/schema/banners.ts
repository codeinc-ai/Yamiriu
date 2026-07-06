import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/** Homepage hero/promo banners (PRD 4.8.8) — `active` gates display, `sortOrder`
 * controls rotation order for multiple concurrently-active banners. */
export const banners = pgTable("banners", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  title: text("title"),
  active: boolean("active").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertBannerSchema = createInsertSchema(banners);
export const selectBannerSchema = createSelectSchema(banners);
export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;

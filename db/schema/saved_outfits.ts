import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./users";
import { categoryEnum } from "./products";

/** Minimal, always-re-hydrated-from-live-data shape (PRD WF-004) — only
 * enough to know which slot/variant, never a stale name/price/stock snapshot. */
export interface SavedOutfitItem {
  slot: "top" | "bottom" | "shoes" | "accessory_jacket";
  productId: string;
  variantId: string;
}

export const savedOutfits = pgTable("saved_outfits", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  avatarType: categoryEnum("avatar_type").notNull(),
  name: text("name"),
  thumbnailUrl: text("thumbnail_url"),
  items: jsonb("items").$type<SavedOutfitItem[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertSavedOutfitSchema = createInsertSchema(savedOutfits);
export const selectSavedOutfitSchema = createSelectSchema(savedOutfits);
export type SavedOutfit = typeof savedOutfits.$inferSelect;
export type NewSavedOutfit = typeof savedOutfits.$inferInsert;

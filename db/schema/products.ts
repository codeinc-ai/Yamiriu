import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const categoryEnum = pgEnum("category", ["men", "women", "kids"]);
export const itemTypeEnum = pgEnum("item_type", [
  "top",
  "bottom",
  "shoes",
  "accessory",
  "jacket",
]);

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  category: categoryEnum("category").notNull(),
  itemType: itemTypeEnum("item_type"),
  // Admin-uploaded gallery (UploadThing) — null/empty until an admin uploads
  // real photography; lib/product-images.ts falls back to placeholders.
  images: jsonb("images").$type<string[]>(),
  hasModel: boolean("has_model").default(false).notNull(),
  modelUrl: text("model_url"),
  published: boolean("published").default(false).notNull(),
  // Demo-only signal for the "bestselling" sort until real order aggregation
  // exists; will be superseded by a computed value from order_items later.
  salesCount: integer("sales_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
});

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

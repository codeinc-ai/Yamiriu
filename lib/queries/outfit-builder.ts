import "server-only";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { products, productVariants } from "@/db/schema";
import type { ShopCategory } from "@/lib/categories";

/**
 * The outfit builder groups the 5 db item types into 4 UI tabs — accessory
 * and jacket share one "Accessory/Jacket" tab/slot (PRD 4.4, WF-004).
 */
export type OutfitSlot = "top" | "bottom" | "shoes" | "accessory_jacket";

export const OUTFIT_SLOT_ITEM_TYPES: Record<
  OutfitSlot,
  Array<"top" | "bottom" | "shoes" | "accessory" | "jacket">
> = {
  top: ["top"],
  bottom: ["bottom"],
  shoes: ["shoes"],
  accessory_jacket: ["accessory", "jacket"],
};

export interface OutfitBuilderProduct {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
  modelUrl: string;
  /** True if at least one non-deleted variant has stock > 0 (PRD WF-004
   * edge case — out-of-stock items stay selectable for styling, just
   * excluded from add-to-cart/save). */
  inStock: boolean;
}

function slotForItemType(
  itemType: "top" | "bottom" | "shoes" | "accessory" | "jacket" | null
): OutfitSlot | null {
  if (!itemType) return null;
  return (
    (Object.keys(OUTFIT_SLOT_ITEM_TYPES) as OutfitSlot[]).find((s) =>
      OUTFIT_SLOT_ITEM_TYPES[s].includes(itemType)
    ) ?? null
  );
}

async function getInStockProductIds(productIds: string[]): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  const rows = await db
    .selectDistinct({ productId: productVariants.productId })
    .from(productVariants)
    .where(
      and(
        inArray(productVariants.productId, productIds),
        gt(productVariants.stock, 0),
        isNull(productVariants.deletedAt)
      )
    );
  return new Set(rows.map((r) => r.productId));
}

/** Eligible products for the outfit builder: published, has a 3D model, and
 * matches the selected avatar type — grouped by UI slot. */
export async function getOutfitBuilderProducts(
  avatarType: ShopCategory
): Promise<Record<OutfitSlot, OutfitBuilderProduct[]>> {
  await dbReady;
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
      itemType: products.itemType,
      modelUrl: products.modelUrl,
    })
    .from(products)
    .where(
      and(
        eq(products.category, avatarType),
        eq(products.hasModel, true),
        eq(products.published, true),
        isNull(products.deletedAt)
      )
    );

  const inStockIds = await getInStockProductIds(rows.map((r) => r.id));

  const result: Record<OutfitSlot, OutfitBuilderProduct[]> = {
    top: [],
    bottom: [],
    shoes: [],
    accessory_jacket: [],
  };

  for (const row of rows) {
    if (!row.modelUrl) continue;
    const slot = slotForItemType(row.itemType);
    if (!slot) continue;
    result[slot].push({
      id: row.id,
      slug: row.slug,
      name: row.name,
      price: row.price,
      category: row.category,
      modelUrl: row.modelUrl,
      inStock: inStockIds.has(row.id),
    });
  }

  return result;
}

/** Resolves multiple deep-linked product ids (e.g. `?items=id1,id2,id3` from
 * a lookbook entry's "Recreate in Outfit Builder" CTA) to avatar type + slot
 * each — same eligibility rules as the single-product lookup. Products that
 * don't match the first eligible product's avatar type are dropped so a
 * lookbook can't accidentally mix men's/women's/kids' avatars. */
export async function getOutfitBuilderProductsByIds(
  productIds: string[]
): Promise<Array<{ product: OutfitBuilderProduct; slot: OutfitSlot }>> {
  await dbReady;
  if (productIds.length === 0) return [];

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
      itemType: products.itemType,
      modelUrl: products.modelUrl,
    })
    .from(products)
    .where(
      and(
        inArray(products.id, productIds),
        eq(products.hasModel, true),
        eq(products.published, true),
        isNull(products.deletedAt)
      )
    );

  const inStockIds = await getInStockProductIds(rows.map((r) => r.id));
  // Preserve the caller's requested order rather than the DB's arbitrary one.
  const rowById = new Map(rows.map((r) => [r.id, r]));

  const resolved: Array<{ product: OutfitBuilderProduct; slot: OutfitSlot }> = [];
  let avatarType: ShopCategory | null = null;

  for (const id of productIds) {
    const row = rowById.get(id);
    if (!row || !row.modelUrl) continue;
    const slot = slotForItemType(row.itemType);
    if (!slot) continue;
    if (avatarType === null) avatarType = row.category;
    if (row.category !== avatarType) continue;

    resolved.push({
      slot,
      product: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        price: row.price,
        category: row.category,
        modelUrl: row.modelUrl,
        inStock: inStockIds.has(row.id),
      },
    });
  }

  return resolved;
}

/** Resolves a deep-linked `?item=` product id (from the PDP "Style This"
 * button) to its avatar type + outfit slot, so the builder can pre-select it. */
export async function getOutfitBuilderProductById(
  productId: string
): Promise<{ product: OutfitBuilderProduct; slot: OutfitSlot } | null> {
  await dbReady;
  const row = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.hasModel, true),
      eq(products.published, true),
      isNull(products.deletedAt)
    ),
  });
  if (!row || !row.modelUrl) return null;

  const slot = slotForItemType(row.itemType);
  if (!slot) return null;

  const inStockIds = await getInStockProductIds([row.id]);

  return {
    slot,
    product: {
      id: row.id,
      slug: row.slug,
      name: row.name,
      price: row.price,
      category: row.category,
      modelUrl: row.modelUrl,
      inStock: inStockIds.has(row.id),
    },
  };
}

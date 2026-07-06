import "server-only";
import { and, eq, isNull, inArray, desc } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { savedOutfits, productVariants, products, type SavedOutfitItem } from "@/db/schema";
import type { OutfitBuilderProduct, OutfitSlot } from "./outfit-builder";

async function getVariantStockMap(variantIds: string[]): Promise<Map<string, number>> {
  if (variantIds.length === 0) return new Map();
  const rows = await db
    .select({ id: productVariants.id, stock: productVariants.stock })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));
  return new Map(rows.map((r) => [r.id, r.stock]));
}

export interface SavedOutfitListItem {
  id: string;
  name: string | null;
  avatarType: OutfitBuilderProduct["category"];
  thumbnailUrl: string | null;
  createdAt: string;
  itemCount: number;
  hasOutOfStockItem: boolean;
  /** Slot/productId/variantId only — enough for the card's direct "Add to
   * Cart" action (already-chosen sizes, no picker needed) via
   * validateOutfitVariants. */
  items: SavedOutfitItem[];
}

/** For /account/saved-outfits — a lightweight list with a live-rechecked
 * out-of-stock badge per card (PRD WF-004 edge case), no full product refetch. */
export async function getSavedOutfitsForUser(userId: string): Promise<SavedOutfitListItem[]> {
  await dbReady;
  const rows = await db
    .select()
    .from(savedOutfits)
    .where(and(eq(savedOutfits.userId, userId), isNull(savedOutfits.deletedAt)))
    .orderBy(desc(savedOutfits.createdAt));

  const allVariantIds = rows.flatMap((row) => row.items.map((item) => item.variantId));
  const stockMap = await getVariantStockMap(allVariantIds);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    avatarType: row.avatarType,
    thumbnailUrl: row.thumbnailUrl,
    createdAt: row.createdAt.toISOString(),
    itemCount: row.items.length,
    hasOutOfStockItem: row.items.some((item) => (stockMap.get(item.variantId) ?? 0) <= 0),
    items: row.items,
  }));
}

export interface ResolvedSavedOutfitItem {
  slot: OutfitSlot;
  variantId: string;
  size: string;
  color: string;
  product: OutfitBuilderProduct;
}

export interface ResolvedSavedOutfit {
  id: string;
  name: string | null;
  avatarType: OutfitBuilderProduct["category"];
  items: ResolvedSavedOutfitItem[];
}

/**
 * Resolves one saved outfit (ownership-checked) into full, live product data
 * for "Edit in Builder" rehydration — never trusts a stale stored
 * name/price, only the slot/productId/variantId are actually persisted.
 * Items whose product/variant has since been deleted or unpublished are
 * silently dropped (best-effort rehydration, not an error).
 */
export async function getSavedOutfitForEdit(
  outfitId: string,
  userId: string
): Promise<ResolvedSavedOutfit | null> {
  await dbReady;
  const outfit = await db.query.savedOutfits.findFirst({
    where: and(
      eq(savedOutfits.id, outfitId),
      eq(savedOutfits.userId, userId),
      isNull(savedOutfits.deletedAt)
    ),
  });
  if (!outfit) return null;

  if (outfit.items.length === 0) {
    return { id: outfit.id, name: outfit.name, avatarType: outfit.avatarType, items: [] };
  }

  const variantIds = outfit.items.map((item) => item.variantId);
  const variantRows = await db
    .select({
      variantId: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
      variantDeletedAt: productVariants.deletedAt,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
      modelUrl: products.modelUrl,
      published: products.published,
      productDeletedAt: products.deletedAt,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const byVariantId = new Map(variantRows.map((row) => [row.variantId, row]));

  const items: ResolvedSavedOutfitItem[] = [];
  for (const stored of outfit.items) {
    const row = byVariantId.get(stored.variantId);
    if (!row || !row.modelUrl || !row.published || row.productDeletedAt || row.variantDeletedAt) {
      continue;
    }
    items.push({
      slot: stored.slot,
      variantId: stored.variantId,
      size: row.size,
      color: row.color,
      product: {
        id: row.productId,
        slug: row.slug,
        name: row.name,
        price: row.price,
        category: row.category,
        modelUrl: row.modelUrl,
        inStock: row.stock > 0,
      },
    });
  }

  return { id: outfit.id, name: outfit.name, avatarType: outfit.avatarType, items };
}

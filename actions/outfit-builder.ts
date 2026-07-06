"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { productVariants, products, savedOutfits, type SavedOutfitItem } from "@/db/schema";
import { isShopCategory, type ShopCategory } from "@/lib/categories";
import { getCurrentUser } from "@/lib/auth-guards";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request";
import {
  getOutfitBuilderProducts,
  type OutfitBuilderProduct,
  type OutfitSlot,
} from "@/lib/queries/outfit-builder";

/**
 * Client-callable wrapper around the outfit-builder query — the product
 * strips re-fetch through this (via TanStack Query) every time the avatar
 * type is switched, which is what drives the "shimmer chips" loading state.
 */
export async function fetchOutfitBuilderProducts(
  avatarType: unknown
): Promise<Record<OutfitSlot, OutfitBuilderProduct[]>> {
  if (typeof avatarType !== "string" || !isShopCategory(avatarType)) {
    return { top: [], bottom: [], shoes: [], accessory_jacket: [] };
  }
  return getOutfitBuilderProducts(avatarType);
}

// ---------------------------------------------------------------------------
// Variant picker (size selection before add-to-cart/save)
// ---------------------------------------------------------------------------

const productIdsSchema = z.array(z.string().min(1)).max(10);

export interface VariantOption {
  id: string;
  size: string;
  color: string;
  stock: number;
}

/** Live variant/stock options per product, for the compact size picker shown
 * before "Add All to Cart" / "Save Outfit" turn a product selection into a
 * concrete cart/saved-outfit line (PRD 4.7). */
export async function fetchProductVariantsForOutfit(
  rawProductIds: unknown
): Promise<Record<string, VariantOption[]>> {
  const parsed = productIdsSchema.safeParse(rawProductIds);
  if (!parsed.success || parsed.data.length === 0) return {};

  const rows = await db
    .select({
      productId: productVariants.productId,
      id: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .where(and(inArray(productVariants.productId, parsed.data), isNull(productVariants.deletedAt)));

  const result: Record<string, VariantOption[]> = {};
  for (const row of rows) {
    (result[row.productId] ??= []).push({
      id: row.id,
      size: row.size,
      color: row.color,
      stock: row.stock,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Add All to Cart (WF-005) — variant/stock validation
// ---------------------------------------------------------------------------

const slotEnum = z.enum(["top", "bottom", "shoes", "accessory_jacket"]);

const validateInputSchema = z
  .array(z.object({ slot: slotEnum, variantId: z.string().min(1) }))
  .min(1)
  .max(10);

export interface OutfitVariantValidation {
  slot: OutfitSlot;
  variantId: string;
  ok: boolean;
  reason?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  price?: string;
  size?: string;
  color?: string;
  category?: ShopCategory;
}

export interface ValidateOutfitVariantsResult {
  ok: boolean;
  error?: string;
  items: OutfitVariantValidation[];
}

/**
 * Live stock/availability check for a set of chosen (slot, variantId) pairs —
 * the authoritative gate before anything is added to the cart or saved,
 * mirroring actions/cart.ts's getCartLineData pattern (never trust client
 * state). Used both by the live builder's "Add All to Cart" and by
 * /account/saved-outfits' per-card "Add to Cart".
 */
export async function validateOutfitVariants(rawInput: unknown): Promise<ValidateOutfitVariantsResult> {
  const ip = getClientIp(await headers());
  const rl = await checkRateLimit("api", ip);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly.", items: [] };
  }

  const parsed = validateInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Nothing to validate.", items: [] };
  }

  const variantIds = parsed.data.map((i) => i.variantId);
  const rows = await db
    .select({
      variantId: productVariants.id,
      stock: productVariants.stock,
      size: productVariants.size,
      color: productVariants.color,
      variantDeletedAt: productVariants.deletedAt,
      price: products.price,
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      category: products.category,
      published: products.published,
      productDeletedAt: products.deletedAt,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const byVariantId = new Map(rows.map((row) => [row.variantId, row]));

  const items: OutfitVariantValidation[] = parsed.data.map(({ slot, variantId }) => {
    const row = byVariantId.get(variantId);
    if (!row || !row.published || row.variantDeletedAt || row.productDeletedAt) {
      return { slot, variantId, ok: false, reason: "No longer available" };
    }
    if (row.stock <= 0) {
      return { slot, variantId, ok: false, reason: "Out of stock", productName: row.productName };
    }
    return {
      slot,
      variantId,
      ok: true,
      productId: row.productId,
      productName: row.productName,
      productSlug: row.productSlug,
      price: row.price,
      size: row.size,
      color: row.color,
      category: row.category,
    };
  });

  return { ok: true, items };
}

// ---------------------------------------------------------------------------
// Save Outfit (WF-004)
// ---------------------------------------------------------------------------

const saveOutfitSchema = z.object({
  avatarType: z.enum(["men", "women", "kids"]),
  name: z.string().trim().max(80).optional(),
  items: z
    .array(z.object({ slot: slotEnum, productId: z.string().min(1), variantId: z.string().min(1) }))
    .min(1)
    .max(10),
  thumbnailUrl: z.string().trim().max(2000).optional().nullable(),
});

export interface SaveOutfitResult {
  ok: boolean;
  error?: string;
  outfitId?: string;
}

export async function saveOutfit(rawInput: unknown): Promise<SaveOutfitResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to save your outfit." };
  }

  const rl = await checkRateLimit("api", user.id);
  if (!rl.success) {
    return { ok: false, error: "Too many attempts. Please try again shortly." };
  }

  const parsed = saveOutfitSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const input = parsed.data;

  // Existence check only (not stock) — an out-of-stock item can still be
  // saved, it just shows a badge when reopened (PRD WF-004 edge case).
  const variantIds = input.items.map((item) => item.variantId);
  const rows = await db
    .select({ variantId: productVariants.id })
    .from(productVariants)
    .where(inArray(productVariants.id, variantIds));
  const validVariantIds = new Set(rows.map((row) => row.variantId));

  const validItems: SavedOutfitItem[] = input.items
    .filter((item) => validVariantIds.has(item.variantId))
    .map((item) => ({ slot: item.slot, productId: item.productId, variantId: item.variantId }));

  if (validItems.length === 0) {
    return { ok: false, error: "None of the selected items could be saved. Please try again." };
  }

  const [row] = await db
    .insert(savedOutfits)
    .values({
      userId: user.id,
      avatarType: input.avatarType,
      name: input.name?.trim() || null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      items: validItems,
    })
    .returning();

  return { ok: true, outfitId: row.id };
}

// ---------------------------------------------------------------------------
// Manage saved outfits
// ---------------------------------------------------------------------------

export async function deleteSavedOutfit(rawId: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const parsed = z.string().min(1).safeParse(rawId);
  if (!parsed.success) return { ok: false, error: "Invalid outfit." };

  const result = await db
    .update(savedOutfits)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(savedOutfits.id, parsed.data),
        eq(savedOutfits.userId, user.id),
        isNull(savedOutfits.deletedAt)
      )
    )
    .returning();

  if (result.length === 0) return { ok: false, error: "Outfit not found." };
  return { ok: true };
}

const renameSchema = z.object({
  outfitId: z.string().min(1),
  name: z.string().trim().max(80),
});

export async function renameSavedOutfit(
  rawInput: unknown
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const parsed = renameSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Enter a valid name." };

  const result = await db
    .update(savedOutfits)
    .set({ name: parsed.data.name || null })
    .where(
      and(
        eq(savedOutfits.id, parsed.data.outfitId),
        eq(savedOutfits.userId, user.id),
        isNull(savedOutfits.deletedAt)
      )
    )
    .returning();

  if (result.length === 0) return { ok: false, error: "Outfit not found." };
  return { ok: true };
}

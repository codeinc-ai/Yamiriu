"use server";

import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";

const idsSchema = z.array(z.string().min(1)).max(100);

export interface CartLineData {
  variantId: string;
  stock: number;
  price: string;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  /** False if the variant or its product was deleted/unpublished since being
   * added to the cart — the line should be removed client-side. */
  available: boolean;
}

/**
 * Live stock + price snapshot for a set of cart line variant ids. The cart
 * page uses this to re-validate the client (Zustand/localStorage) cart against
 * the database, enabling optimistic quantity updates with rollback on
 * conflict (PRD FR-003) — e.g. stock sold out since the item was added.
 */
export async function getCartLineData(variantIds: unknown): Promise<CartLineData[]> {
  const parsed = idsSchema.safeParse(variantIds);
  if (!parsed.success || parsed.data.length === 0) return [];

  const rows = await db
    .select({
      variantId: productVariants.id,
      stock: productVariants.stock,
      size: productVariants.size,
      color: productVariants.color,
      variantDeletedAt: productVariants.deletedAt,
      price: products.price,
      productName: products.name,
      productSlug: products.slug,
      published: products.published,
      productDeletedAt: products.deletedAt,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, parsed.data));

  return rows.map((row) => ({
    variantId: row.variantId,
    stock: row.stock,
    price: row.price,
    productName: row.productName,
    productSlug: row.productSlug,
    size: row.size,
    color: row.color,
    available: row.published && !row.variantDeletedAt && !row.productDeletedAt,
  }));
}

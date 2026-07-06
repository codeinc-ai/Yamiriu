import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import type { ShopCategory } from "@/lib/categories";

export interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
  wishlistedAt: string;
}

/** Row-level scoped to `userId` (S-024) — used by /account/wishlist. */
export async function getWishlistProducts(userId: string): Promise<WishlistProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
      wishlistedAt: wishlists.createdAt,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .where(
      and(
        eq(wishlists.userId, userId),
        isNull(wishlists.deletedAt),
        eq(products.published, true),
        isNull(products.deletedAt)
      )
    )
    .orderBy(desc(wishlists.createdAt));

  return rows.map((row) => ({ ...row, wishlistedAt: row.wishlistedAt.toISOString() }));
}

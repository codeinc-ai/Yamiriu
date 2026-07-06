import "server-only";
import {
  and,
  or,
  eq,
  gt,
  lt,
  gte,
  lte,
  inArray,
  isNull,
  exists,
  desc,
  sql,
} from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db, dbReady } from "@/db";
import { products, productVariants, reviews, users } from "@/db/schema";
import type { ShopCategory } from "@/lib/categories";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import type {
  ProductListParams,
  ProductListResult,
  ProductFacets,
  SortValue,
} from "@/lib/shop-types";

const DEFAULT_LIMIT = 12;

const SORT_CONFIG: Record<
  SortValue,
  { column: AnyPgColumn; direction: "asc" | "desc" }
> = {
  newest: { column: products.createdAt, direction: "desc" },
  price_asc: { column: products.price, direction: "asc" },
  price_desc: { column: products.price, direction: "desc" },
  bestselling: { column: products.salesCount, direction: "desc" },
};

function cursorValueFor(sort: SortValue, row: { createdAt: Date; price: string; salesCount: number }): string {
  if (sort === "newest") return row.createdAt.toISOString();
  if (sort === "bestselling") return String(row.salesCount);
  return row.price;
}

function parseCursorValue(sort: SortValue, raw: string): string | number | Date {
  if (sort === "newest") return new Date(raw);
  if (sort === "bestselling") return Number(raw);
  return raw;
}

// ---------------------------------------------------------------------------
// Product list (filters + sort + cursor pagination)
// ---------------------------------------------------------------------------

export async function getProductList(
  params: ProductListParams
): Promise<ProductListResult> {
  await dbReady;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const { column, direction } = SORT_CONFIG[params.sort];

  const conditions = [eq(products.published, true), isNull(products.deletedAt)];

  if (params.category) {
    conditions.push(eq(products.category, params.category));
  }

  if (params.sizes.length > 0) {
    conditions.push(
      exists(
        db
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              inArray(productVariants.size, params.sizes),
              isNull(productVariants.deletedAt)
            )
          )
      )
    );
  }

  if (params.colors.length > 0) {
    conditions.push(
      exists(
        db
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              inArray(productVariants.color, params.colors),
              isNull(productVariants.deletedAt)
            )
          )
      )
    );
  }

  if (params.availability === "in_stock") {
    conditions.push(
      exists(
        db
          .select({ id: productVariants.id })
          .from(productVariants)
          .where(
            and(
              eq(productVariants.productId, products.id),
              gt(productVariants.stock, 0),
              isNull(productVariants.deletedAt)
            )
          )
      )
    );
  }

  if (params.priceMin != null) {
    conditions.push(gte(products.price, String(params.priceMin)));
  }
  if (params.priceMax != null) {
    conditions.push(lte(products.price, String(params.priceMax)));
  }

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      const value = parseCursorValue(params.sort, decoded.v);
      const tiebreak = and(eq(column, value), gt(products.id, decoded.id));
      conditions.push(
        (direction === "desc" ? or(lt(column, value), tiebreak) : or(gt(column, value), tiebreak))!
      );
    }
  }

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
      salesCount: products.salesCount,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(direction === "desc" ? desc(column) : column, products.id)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last ? encodeCursor(cursorValueFor(params.sort, last), last.id) : null,
  };
}

// ---------------------------------------------------------------------------
// Filter sidebar facets (available sizes/colors/price bounds)
// ---------------------------------------------------------------------------

export async function getProductFacets(
  category?: ShopCategory
): Promise<ProductFacets> {
  await dbReady;
  const productConditions = [eq(products.published, true), isNull(products.deletedAt)];
  if (category) productConditions.push(eq(products.category, category));

  const variantRows = await db
    .select({
      size: productVariants.size,
      color: productVariants.color,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(...productConditions, isNull(productVariants.deletedAt)));

  const [priceBounds] = await db
    .select({
      min: sql<string>`min(${products.price})`,
      max: sql<string>`max(${products.price})`,
    })
    .from(products)
    .where(and(...productConditions));

  return {
    sizes: Array.from(new Set(variantRows.map((r) => r.size))).sort(),
    colors: Array.from(new Set(variantRows.map((r) => r.color))).sort(),
    priceMin: priceBounds?.min ? Math.floor(Number(priceBounds.min)) : 0,
    priceMax: priceBounds?.max ? Math.ceil(Number(priceBounds.max)) : 0,
  };
}

// ---------------------------------------------------------------------------
// PDP: product by slug (with variants), related products, review summary
// ---------------------------------------------------------------------------

export async function getProductBySlug(slug: string) {
  await dbReady;
  const product = await db.query.products.findFirst({
    where: and(
      eq(products.slug, slug),
      eq(products.published, true),
      isNull(products.deletedAt)
    ),
  });
  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(
      and(eq(productVariants.productId, product.id), isNull(productVariants.deletedAt))
    );

  return { product, variants };
}

export async function getRelatedProducts(
  product: { id: string; category: ShopCategory },
  limit = 4
) {
  await dbReady;
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
    })
    .from(products)
    .where(
      and(
        eq(products.category, product.category),
        eq(products.published, true),
        isNull(products.deletedAt),
        sql`${products.id} != ${product.id}`
      )
    )
    .orderBy(desc(products.salesCount))
    .limit(limit);
}

export async function getProductReviews(productId: string) {
  await dbReady;
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      photoUrls: reviews.photoUrls,
      createdAt: reviews.createdAt,
      reviewerName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(
      and(
        eq(reviews.productId, productId),
        eq(reviews.status, "approved"),
        isNull(reviews.deletedAt)
      )
    )
    .orderBy(desc(reviews.createdAt));

  const count = rows.length;
  const average =
    count > 0 ? rows.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return { reviews: rows, average, count };
}

// ---------------------------------------------------------------------------
// Static params / homepage bestsellers
// ---------------------------------------------------------------------------

export async function getAllPublishedSlugs(): Promise<string[]> {
  await dbReady;
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(and(eq(products.published, true), isNull(products.deletedAt)));
  return rows.map((r) => r.slug);
}

/** slug + last-modified for app/sitemap.ts (BLOCK 02). */
export async function getSitemapProducts(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  await dbReady;
  const rows = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt, createdAt: products.createdAt })
    .from(products)
    .where(and(eq(products.published, true), isNull(products.deletedAt)));
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt ?? r.createdAt }));
}

export async function getBestsellers(limit = 6) {
  await dbReady;
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      price: products.price,
      category: products.category,
    })
    .from(products)
    .where(and(eq(products.published, true), isNull(products.deletedAt)))
    .orderBy(desc(products.salesCount))
    .limit(limit);
}

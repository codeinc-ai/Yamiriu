import "server-only";
import { and, or, eq, gt, lt, ilike, inArray, isNull, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { encodeCursor, decodeCursor } from "@/lib/cursor";
import type { ShopCategory } from "@/lib/categories";

const ADMIN_PRODUCTS_PAGE_SIZE = 20;

export type AdminPublishFilter = "all" | "published" | "unpublished";

export interface AdminProductListParams {
  search?: string;
  publishFilter?: AdminPublishFilter;
  cursor?: string | null;
}

export interface AdminProductListItem {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
  published: boolean;
  hasModel: boolean;
  variantCount: number;
  totalStock: number;
  createdAt: string;
}

export interface AdminProductListResult {
  items: AdminProductListItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** Admin product table: search, publish-status filter, cursor pagination
 * (never OFFSET — PRD Rule 4). Soft-deleted products are always excluded;
 * "soft delete only" means there is no path back to a hard row deletion. */
export async function getAdminProductList(
  params: AdminProductListParams
): Promise<AdminProductListResult> {
  const conditions = [isNull(products.deletedAt)];

  if (params.search?.trim()) {
    const term = `%${params.search.trim()}%`;
    conditions.push(or(ilike(products.name, term), ilike(products.slug, term))!);
  }
  if (params.publishFilter === "published") {
    conditions.push(eq(products.published, true));
  } else if (params.publishFilter === "unpublished") {
    conditions.push(eq(products.published, false));
  }

  if (params.cursor) {
    const decoded = decodeCursor(params.cursor);
    if (decoded) {
      const value = new Date(decoded.v);
      conditions.push(
        or(lt(products.createdAt, value), and(eq(products.createdAt, value), gt(products.id, decoded.id)))!
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
      published: products.published,
      hasModel: products.hasModel,
      createdAt: products.createdAt,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt), products.id)
    .limit(ADMIN_PRODUCTS_PAGE_SIZE + 1);

  const hasMore = rows.length > ADMIN_PRODUCTS_PAGE_SIZE;
  const items = hasMore ? rows.slice(0, ADMIN_PRODUCTS_PAGE_SIZE) : rows;
  const last = items[items.length - 1];

  const productIds = items.map((r) => r.id);
  const variantAggregates =
    productIds.length > 0
      ? await db
          .select({
            productId: productVariants.productId,
            variantCount: sql<number>`count(*)::int`,
            totalStock: sql<number>`coalesce(sum(${productVariants.stock}), 0)::int`,
          })
          .from(productVariants)
          .where(and(inArray(productVariants.productId, productIds), isNull(productVariants.deletedAt)))
          .groupBy(productVariants.productId)
      : [];
  const aggByProductId = new Map(variantAggregates.map((a) => [a.productId, a]));

  return {
    items: items.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      price: r.price,
      category: r.category,
      published: r.published,
      hasModel: r.hasModel,
      variantCount: aggByProductId.get(r.id)?.variantCount ?? 0,
      totalStock: aggByProductId.get(r.id)?.totalStock ?? 0,
      createdAt: r.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.createdAt.toISOString(), last.id) : null,
  };
}

export interface AdminProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  category: ShopCategory;
  itemType: string | null;
  images: string[];
  hasModel: boolean;
  modelUrl: string | null;
  published: boolean;
  variants: Array<{ id: string; size: string; color: string; stock: number; sku: string }>;
}

export async function getAdminProductDetail(id: string): Promise<AdminProductDetail | null> {
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), isNull(products.deletedAt)),
  });
  if (!product) return null;

  const variants = await db
    .select({
      id: productVariants.id,
      size: productVariants.size,
      color: productVariants.color,
      stock: productVariants.stock,
      sku: productVariants.sku,
    })
    .from(productVariants)
    .where(and(eq(productVariants.productId, id), isNull(productVariants.deletedAt)))
    .orderBy(productVariants.size, productVariants.color);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    category: product.category,
    itemType: product.itemType,
    images: product.images ?? [],
    hasModel: product.hasModel,
    modelUrl: product.modelUrl,
    published: product.published,
    variants,
  };
}

/** Cross-product model status for /admin/outfit-assets (PRD 4.8.6). */
export interface OutfitAssetRow {
  id: string;
  slug: string;
  name: string;
  category: ShopCategory;
  hasModel: boolean;
  modelUrl: string | null;
  published: boolean;
}

export async function getOutfitAssetStatus(): Promise<OutfitAssetRow[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      category: products.category,
      hasModel: products.hasModel,
      modelUrl: products.modelUrl,
      published: products.published,
    })
    .from(products)
    .where(isNull(products.deletedAt))
    .orderBy(desc(products.hasModel), products.name);

  return rows;
}

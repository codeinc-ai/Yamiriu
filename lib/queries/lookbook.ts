import "server-only";
import { and, eq, inArray, isNull, desc } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { lookbookEntries, products } from "@/db/schema";
import type { ShopCategory } from "@/lib/categories";

export interface LookbookListItem {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
}

export async function getPublishedLookbookEntries(limit?: number): Promise<LookbookListItem[]> {
  await dbReady;
  const rows = await db
    .select({
      id: lookbookEntries.id,
      slug: lookbookEntries.slug,
      title: lookbookEntries.title,
      imageUrl: lookbookEntries.imageUrl,
    })
    .from(lookbookEntries)
    .where(and(eq(lookbookEntries.published, true), isNull(lookbookEntries.deletedAt)))
    .orderBy(desc(lookbookEntries.createdAt))
    .limit(limit ?? 100);

  return rows;
}

export interface LookbookProductCard {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
}

export interface LookbookEntryDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  products: LookbookProductCard[];
}

export async function getLookbookEntryBySlug(slug: string): Promise<LookbookEntryDetail | null> {
  await dbReady;
  const entry = await db.query.lookbookEntries.findFirst({
    where: and(eq(lookbookEntries.slug, slug), eq(lookbookEntries.published, true), isNull(lookbookEntries.deletedAt)),
  });
  if (!entry) return null;

  const relatedIds = Array.isArray(entry.relatedProductIds) ? (entry.relatedProductIds as string[]) : [];

  const productRows =
    relatedIds.length > 0
      ? await db
          .select({
            id: products.id,
            slug: products.slug,
            name: products.name,
            price: products.price,
            category: products.category,
          })
          .from(products)
          .where(and(inArray(products.id, relatedIds), eq(products.published, true), isNull(products.deletedAt)))
      : [];

  // Preserve the admin-authored display order rather than the DB's arbitrary one.
  const productById = new Map(productRows.map((p) => [p.id, p]));
  const orderedProducts = relatedIds.map((id) => productById.get(id)).filter((p): p is LookbookProductCard => Boolean(p));

  return {
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    imageUrl: entry.imageUrl,
    products: orderedProducts,
  };
}

export async function getAllPublishedLookbookSlugs(): Promise<string[]> {
  await dbReady;
  const rows = await db
    .select({ slug: lookbookEntries.slug })
    .from(lookbookEntries)
    .where(and(eq(lookbookEntries.published, true), isNull(lookbookEntries.deletedAt)));
  return rows.map((r) => r.slug);
}

/** slug + last-modified for app/sitemap.ts (BLOCK 02). */
export async function getSitemapLookbookEntries(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  await dbReady;
  const rows = await db
    .select({ slug: lookbookEntries.slug, updatedAt: lookbookEntries.updatedAt, createdAt: lookbookEntries.createdAt })
    .from(lookbookEntries)
    .where(and(eq(lookbookEntries.published, true), isNull(lookbookEntries.deletedAt)));
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt ?? r.createdAt }));
}

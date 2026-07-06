import "server-only";
import { isNull, desc } from "drizzle-orm";
import { db } from "@/db";
import { banners, lookbookEntries, journalPosts } from "@/db/schema";

export interface AdminBannerRow {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  title: string | null;
  active: boolean;
  sortOrder: number;
}

export async function getAdminBanners(): Promise<AdminBannerRow[]> {
  return db
    .select({
      id: banners.id,
      imageUrl: banners.imageUrl,
      linkUrl: banners.linkUrl,
      title: banners.title,
      active: banners.active,
      sortOrder: banners.sortOrder,
    })
    .from(banners)
    .where(isNull(banners.deletedAt))
    .orderBy(banners.sortOrder, desc(banners.createdAt));
}

export interface AdminLookbookRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string;
  relatedProductIds: string[];
  published: boolean;
}

export async function getAdminLookbookEntries(): Promise<AdminLookbookRow[]> {
  const rows = await db
    .select({
      id: lookbookEntries.id,
      slug: lookbookEntries.slug,
      title: lookbookEntries.title,
      description: lookbookEntries.description,
      imageUrl: lookbookEntries.imageUrl,
      relatedProductIds: lookbookEntries.relatedProductIds,
      published: lookbookEntries.published,
    })
    .from(lookbookEntries)
    .where(isNull(lookbookEntries.deletedAt))
    .orderBy(desc(lookbookEntries.createdAt));

  return rows.map((r) => ({
    ...r,
    relatedProductIds: Array.isArray(r.relatedProductIds) ? (r.relatedProductIds as string[]) : [],
  }));
}

export interface AdminJournalRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  published: boolean;
}

export async function getAdminJournalPosts(): Promise<AdminJournalRow[]> {
  return db
    .select({
      id: journalPosts.id,
      slug: journalPosts.slug,
      title: journalPosts.title,
      excerpt: journalPosts.excerpt,
      content: journalPosts.content,
      coverImageUrl: journalPosts.coverImageUrl,
      category: journalPosts.category,
      published: journalPosts.published,
    })
    .from(journalPosts)
    .where(isNull(journalPosts.deletedAt))
    .orderBy(desc(journalPosts.createdAt));
}

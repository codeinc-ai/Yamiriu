import "server-only";
import { and, eq, ne, isNull, desc } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { journalPosts, users } from "@/db/schema";

export interface JournalListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
}

export async function getPublishedJournalPosts(category?: string): Promise<JournalListItem[]> {
  await dbReady;
  const conditions = [eq(journalPosts.published, true), isNull(journalPosts.deletedAt)];
  if (category) conditions.push(eq(journalPosts.category, category));

  const rows = await db
    .select({
      id: journalPosts.id,
      slug: journalPosts.slug,
      title: journalPosts.title,
      excerpt: journalPosts.excerpt,
      coverImageUrl: journalPosts.coverImageUrl,
      category: journalPosts.category,
      publishedAt: journalPosts.publishedAt,
    })
    .from(journalPosts)
    .where(and(...conditions))
    .orderBy(desc(journalPosts.publishedAt));

  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null }));
}

export async function getJournalCategories(): Promise<string[]> {
  await dbReady;
  const rows = await db
    .selectDistinct({ category: journalPosts.category })
    .from(journalPosts)
    .where(and(eq(journalPosts.published, true), isNull(journalPosts.deletedAt)));
  return rows.map((r) => r.category).filter((c): c is string => Boolean(c));
}

export interface JournalPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
  authorName: string | null;
}

export async function getJournalPostBySlug(slug: string): Promise<JournalPostDetail | null> {
  await dbReady;
  const row = await db
    .select({
      id: journalPosts.id,
      slug: journalPosts.slug,
      title: journalPosts.title,
      excerpt: journalPosts.excerpt,
      content: journalPosts.content,
      coverImageUrl: journalPosts.coverImageUrl,
      category: journalPosts.category,
      publishedAt: journalPosts.publishedAt,
      authorName: users.name,
    })
    .from(journalPosts)
    .innerJoin(users, eq(journalPosts.authorId, users.id))
    .where(and(eq(journalPosts.slug, slug), eq(journalPosts.published, true), isNull(journalPosts.deletedAt)))
    .limit(1);

  const post = row[0];
  if (!post) return null;

  return { ...post, publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null };
}

export async function getRelatedJournalPosts(
  category: string | null,
  excludeId: string,
  limit = 3
): Promise<JournalListItem[]> {
  await dbReady;
  if (!category) return [];

  const rows = await db
    .select({
      id: journalPosts.id,
      slug: journalPosts.slug,
      title: journalPosts.title,
      excerpt: journalPosts.excerpt,
      coverImageUrl: journalPosts.coverImageUrl,
      category: journalPosts.category,
      publishedAt: journalPosts.publishedAt,
    })
    .from(journalPosts)
    .where(
      and(
        eq(journalPosts.category, category),
        eq(journalPosts.published, true),
        isNull(journalPosts.deletedAt),
        ne(journalPosts.id, excludeId)
      )
    )
    .orderBy(desc(journalPosts.publishedAt))
    .limit(limit);

  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null }));
}

export async function getAllPublishedJournalSlugs(): Promise<string[]> {
  await dbReady;
  const rows = await db
    .select({ slug: journalPosts.slug })
    .from(journalPosts)
    .where(and(eq(journalPosts.published, true), isNull(journalPosts.deletedAt)));
  return rows.map((r) => r.slug);
}

/** slug + last-modified for app/sitemap.ts (BLOCK 02). */
export async function getSitemapJournalPosts(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  await dbReady;
  const rows = await db
    .select({ slug: journalPosts.slug, updatedAt: journalPosts.updatedAt, publishedAt: journalPosts.publishedAt, createdAt: journalPosts.createdAt })
    .from(journalPosts)
    .where(and(eq(journalPosts.published, true), isNull(journalPosts.deletedAt)));
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt ?? r.publishedAt ?? r.createdAt }));
}

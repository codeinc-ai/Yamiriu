import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db, dbReady } from "@/db";
import { banners } from "@/db/schema";

export interface ActiveBanner {
  imageUrl: string;
  linkUrl: string | null;
  title: string | null;
}

/** The highest-priority active banner (lowest sortOrder) for the homepage
 * hero background — admin-managed via /admin/content. Null falls back to
 * the placeholder hero image. */
export async function getPrimaryActiveBanner(): Promise<ActiveBanner | null> {
  await dbReady;
  const row = await db.query.banners.findFirst({
    where: and(eq(banners.active, true), isNull(banners.deletedAt)),
    orderBy: (b, { asc }) => [asc(b.sortOrder)],
  });
  if (!row) return null;
  return { imageUrl: row.imageUrl, linkUrl: row.linkUrl, title: row.title };
}

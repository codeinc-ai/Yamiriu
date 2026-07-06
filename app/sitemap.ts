import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getSitemapProducts } from "@/lib/queries/products";
import { getSitemapJournalPosts } from "@/lib/queries/journal";
import { getSitemapLookbookEntries } from "@/lib/queries/lookbook";

/** Static, publicly-indexable routes — deliberately excludes every
 * auth/account/admin/api/checkout route (BLOCK 02, matches app/robots.ts's
 * disallow list). */
const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/shop/men", changeFrequency: "daily", priority: 0.8 },
  { path: "/shop/women", changeFrequency: "daily", priority: 0.8 },
  { path: "/shop/kids", changeFrequency: "daily", priority: 0.8 },
  { path: "/for-men", changeFrequency: "weekly", priority: 0.8 },
  { path: "/for-women", changeFrequency: "weekly", priority: 0.8 },
  { path: "/for-kids", changeFrequency: "weekly", priority: 0.8 },
  { path: "/outfit-builder", changeFrequency: "monthly", priority: 0.7 },
  { path: "/lookbook", changeFrequency: "weekly", priority: 0.7 },
  { path: "/journal", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.4 },
  { path: "/size-guide", changeFrequency: "yearly", priority: 0.4 },
  { path: "/returns", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/track-order", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, journalPosts, lookbookEntries] = await Promise.all([
    getSitemapProducts(),
    getSitemapJournalPosts(),
    getSitemapLookbookEntries(),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const journalEntries: MetadataRoute.Sitemap = journalPosts.map((p) => ({
    url: `${SITE_URL}/journal/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const lookbookEntriesList: MetadataRoute.Sitemap = lookbookEntries.map((e) => ({
    url: `${SITE_URL}/lookbook/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...journalEntries, ...lookbookEntriesList];
}

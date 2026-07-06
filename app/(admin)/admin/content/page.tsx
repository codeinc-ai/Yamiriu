import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isNull, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminBanners, getAdminLookbookEntries, getAdminJournalPosts } from "@/lib/queries/admin-content";
import { ContentTabs } from "@/components/admin/content/content-tabs";

export const metadata: Metadata = {
  title: "Content",
  robots: { index: false, follow: false },
};

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "content:read")) redirect("/admin");

  const [banners, lookbookEntries, journalPosts, productOptions] = await Promise.all([
    getAdminBanners(),
    getAdminLookbookEntries(),
    getAdminJournalPosts(),
    db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(and(eq(products.published, true), isNull(products.deletedAt))),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Content</h1>
      <ContentTabs
        banners={banners}
        lookbookEntries={lookbookEntries}
        journalPosts={journalPosts}
        productOptions={productOptions}
        canWrite={can(user, "content:write")}
      />
    </div>
  );
}

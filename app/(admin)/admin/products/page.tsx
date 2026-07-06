import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminProductList, type AdminPublishFilter } from "@/lib/queries/admin-products";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProductsTable } from "@/components/admin/products-table";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; cursor?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user, "products:read")) redirect("/admin");
  const canWrite = can(user, "products:write");

  const { search, status, cursor } = await searchParams;
  const publishFilter = (status ?? "all") as AdminPublishFilter;

  const result = await getAdminProductList({ search, publishFilter, cursor });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink">Products</h1>
        {canWrite ? <ButtonLink href="/admin/products/new">New product</ButtonLink> : null}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input label="Search" name="search" defaultValue={search ?? ""} placeholder="Name or slug…" />
        </div>
        <div className="w-48">
          <Select label="Status" name="status" defaultValue={publishFilter}>
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </Select>
        </div>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <ProductsTable items={result.items} />

      {result.hasMore && result.nextCursor ? (
        <div>
          <Link
            href={{
              pathname: "/admin/products",
              query: { search, status: publishFilter, cursor: result.nextCursor },
            }}
            className="text-sm font-medium text-terracotta hover:underline"
          >
            Load more →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

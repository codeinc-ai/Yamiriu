import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminCustomerList } from "@/lib/queries/admin-customers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Customers",
  robots: { index: false, follow: false },
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; cursor?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user, "customers:read")) redirect("/admin");

  const { search, cursor } = await searchParams;
  const result = await getAdminCustomerList({ search, cursor });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Customers</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input label="Search" name="search" defaultValue={search ?? ""} placeholder="Name or email…" />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white/60">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Orders</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {result.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/60">
                  No customers found.
                </td>
              </tr>
            ) : (
              result.items.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-ink">
                    <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                      {customer.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/70">{customer.email}</td>
                  <td className="px-4 py-3 text-ink/70">{customer.orderCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={customer.isActive ? "olive" : "terracotta"}>
                      {customer.isActive ? "Active" : "Banned"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink/60">
                    {new Date(customer.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {result.hasMore && result.nextCursor ? (
        <div>
          <Link
            href={{ pathname: "/admin/customers", query: { search, cursor: result.nextCursor } }}
            className="text-sm font-medium text-terracotta hover:underline"
          >
            Load more →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

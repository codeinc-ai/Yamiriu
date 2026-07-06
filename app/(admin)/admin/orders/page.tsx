import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminOrderList } from "@/lib/queries/admin-orders";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { OrdersTable } from "@/components/admin/orders-table";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    codFlagged?: string;
    cursor?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user, "orders:read")) redirect("/admin");
  const canWrite = can(user, "orders:write");

  const params = await searchParams;
  const codFlagged = params.codFlagged === "1";

  const result = await getAdminOrderList({
    status: codFlagged ? undefined : params.status,
    paymentMethod: params.paymentMethod,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    codFlagged,
    cursor: params.cursor,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Orders</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select label="Status" name="status" defaultValue={params.status ?? ""}>
            <option value="">All</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="pending_review">Under Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </Select>
        </div>
        <div className="w-44">
          <Select label="Payment method" name="paymentMethod" defaultValue={params.paymentMethod ?? ""}>
            <option value="">All</option>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">Easypaisa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cod">COD</option>
            <option value="card">Card</option>
          </Select>
        </div>
        <Input label="From" type="date" name="dateFrom" defaultValue={params.dateFrom ?? ""} />
        <Input label="To" type="date" name="dateTo" defaultValue={params.dateTo ?? ""} />
        <label className="flex h-11 items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="codFlagged" value="1" defaultChecked={codFlagged} className="size-4" />
          COD flagged only
        </label>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <OrdersTable items={result.items} canWrite={canWrite} />

      {result.hasMore && result.nextCursor ? (
        <div>
          <Link
            href={{ pathname: "/admin/orders", query: { ...params, cursor: result.nextCursor } }}
            className="text-sm font-medium text-terracotta hover:underline"
          >
            Load more →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

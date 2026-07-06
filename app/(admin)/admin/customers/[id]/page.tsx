import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getAdminCustomerDetail } from "@/lib/queries/admin-customers";
import { Badge } from "@/components/ui/badge";
import { CustomerBanToggle } from "@/components/admin/customer-ban-toggle";
import { formatPkr } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer Detail",
  robots: { index: false, follow: false },
};

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || !can(user, "customers:read")) redirect("/admin");

  const { id } = await params;
  const customer = await getAdminCustomerDetail(id);
  if (!customer) notFound();

  const canWrite = can(user, "customers:write");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/customers" className="text-sm text-ink/60 hover:text-ink hover:underline">
          ← Back to customers
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{customer.name ?? customer.email}</h1>
          <p className="text-sm text-ink/60">{customer.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={customer.isActive ? "olive" : "terracotta"}>
            {customer.isActive ? "Active" : "Banned"}
          </Badge>
          {canWrite ? <CustomerBanToggle userId={customer.id} isActive={customer.isActive} /> : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">Orders</h2>
          <p className="mt-2 text-3xl font-semibold text-ink">{customer.orders.length}</p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">COD reliability</h2>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {customer.codReliability.totalCodOrders - customer.codReliability.refusedCodOrders}/
            {customer.codReliability.totalCodOrders}
          </p>
          <p className="mt-1 text-xs text-ink/60">
            {customer.codReliability.refusedCodOrders} refused of {customer.codReliability.totalCodOrders} COD orders
          </p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">Saved outfits</h2>
          <p className="mt-2 text-3xl font-semibold text-ink">{customer.savedOutfitsCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-ink">Order history</h2>
        <div className="mt-4 flex flex-col divide-y divide-ink/5">
          {customer.orders.length === 0 ? (
            <p className="py-4 text-sm text-ink/60">No orders yet.</p>
          ) : (
            customer.orders.map((order) => (
              <div key={order.orderNumber} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-ink hover:underline">
                  {order.orderNumber}
                </Link>
                <span className="text-ink/70">{formatPkr(order.total)}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    ORDER_STATUS_BADGE_STYLES[order.status] ?? "bg-ink/10 text-ink/70"
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

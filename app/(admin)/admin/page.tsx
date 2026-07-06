import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import {
  getDashboardKpis,
  getRecentOrders,
  getRecentAuditActivity,
  LOW_STOCK_THRESHOLD,
} from "@/lib/queries/admin-dashboard";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format";
import { ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "order.status_changed": "Order status changed",
  "order.refunded": "Order refunded",
  "order.shipment_created": "Shipment created",
  "product.created": "Product created",
  "product.updated": "Product updated",
  "product.deleted": "Product deleted",
  "return.requested": "Return requested",
  "review.submitted": "Review submitted",
  "user.role_changed": "Role changed",
  "admin.action": "Admin action",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canSeeOrders = can(user, "orders:read");
  const canSeeProducts = can(user, "products:read");
  const canSeeAnalytics = can(user, "analytics:read");
  const canSeeAudit = can(user, "audit:read");

  const [kpis, recentOrders, recentAudit] = await Promise.all([
    canSeeOrders || canSeeProducts || canSeeAnalytics ? getDashboardKpis() : null,
    canSeeOrders ? getRecentOrders() : null,
    canSeeAudit ? getRecentAuditActivity() : null,
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>

      {kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canSeeOrders ? (
            <Card>
              <CardBody>
                <CardTitle>Today&apos;s Orders</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-ink">{kpis.todaysOrders}</p>
              </CardBody>
            </Card>
          ) : null}
          {canSeeOrders ? (
            <Card>
              <CardBody>
                <CardTitle>Today&apos;s Revenue</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-ink">{formatPkr(kpis.todaysRevenue)}</p>
              </CardBody>
            </Card>
          ) : null}
          {canSeeOrders ? (
            <Card>
              <CardBody>
                <CardTitle>Pending COD Reviews</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-ink">{kpis.pendingCodReviews}</p>
                {kpis.pendingCodReviews > 0 ? (
                  <Link href="/admin/orders?codFlagged=1" className="mt-1 inline-block text-sm text-terracotta hover:underline">
                    Review now →
                  </Link>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
          {canSeeProducts ? (
            <Card>
              <CardBody>
                <CardTitle>Low-Stock Alerts</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-ink">{kpis.lowStockCount}</p>
                <p className="mt-1 text-xs text-ink/60">Variants at ≤{LOW_STOCK_THRESHOLD} units</p>
              </CardBody>
            </Card>
          ) : null}
          {canSeeAnalytics ? (
            <Card>
              <CardBody>
                <CardTitle>Outfit → Cart Conversion</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-ink">{kpis.outfitConversionPercent}%</p>
                <p className="mt-1 text-xs text-ink/60">
                  Proxy: share of last 30 days&apos; orders that included an outfit-builder item. See PostHog for the full funnel.
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {recentOrders ? (
          <Card>
            <CardBody>
              <CardTitle>Recent Orders</CardTitle>
              <ul className="mt-4 flex flex-col gap-3">
                {recentOrders.length === 0 ? (
                  <li className="text-sm text-ink/60">No orders yet.</li>
                ) : (
                  recentOrders.map((order) => (
                    <li key={order.orderNumber} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <Link href={`/admin/orders/${order.orderNumber}`} className="font-medium text-ink hover:underline">
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-ink/60">{order.customerEmail ?? "Guest"}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
                    </li>
                  ))
                )}
              </ul>
            </CardBody>
          </Card>
        ) : null}

        {recentAudit ? (
          <Card>
            <CardBody>
              <CardTitle>Recent Activity</CardTitle>
              <ul className="mt-4 flex flex-col gap-3">
                {recentAudit.length === 0 ? (
                  <li className="text-sm text-ink/60">No activity yet.</li>
                ) : (
                  recentAudit.map((entry, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink/80">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</span>
                      <Badge variant="neutral">
                        {new Date(entry.createdAt).toLocaleString("en-PK", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </Badge>
                    </li>
                  ))
                )}
              </ul>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

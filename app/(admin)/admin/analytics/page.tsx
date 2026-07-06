import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { can } from "@/lib/rbac";
import { getSalesOverTime, getBestsellersReport, getOutfitFunnel } from "@/lib/queries/admin-analytics";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { SalesChart } from "@/components/admin/sales-chart";
import { OutfitFunnelChart } from "@/components/admin/outfit-funnel-chart";
import { formatPkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user || !can(user, "analytics:read")) redirect("/admin");

  const [sales, bestsellers, funnel] = await Promise.all([
    getSalesOverTime(30),
    getBestsellersReport(10),
    getOutfitFunnel(30),
  ]);

  const totalRevenue = sales.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = sales.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Analytics</h1>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <CardTitle>Sales — last 30 days</CardTitle>
            <p className="text-sm text-ink/60">
              {formatPkr(totalRevenue)} across {totalOrders} orders
            </p>
          </div>
          <div className="mt-4">
            <SalesChart data={sales} />
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody>
            <CardTitle>Bestsellers</CardTitle>
            <div className="mt-4 flex flex-col divide-y divide-ink/5">
              {bestsellers.length === 0 ? (
                <p className="py-4 text-sm text-ink/60">No sales yet.</p>
              ) : (
                bestsellers.map((item, i) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="text-ink/60">{i + 1}.</span>
                    <span className="flex-1 font-medium text-ink">{item.name}</span>
                    <span className="text-ink/70">{item.quantitySold} sold</span>
                    <span className="text-ink/70">{formatPkr(item.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Outfit builder funnel</CardTitle>
            <p className="mt-1 text-xs text-ink/60">
              Last 30 days · opened/selected/added-to-cart are a local proxy dual-fired alongside
              PostHog — see PostHog for the full funnel breakdown.
            </p>
            <div className="mt-4">
              <OutfitFunnelChart steps={funnel} />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

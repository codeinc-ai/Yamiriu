import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-guards";
import { getOrdersForUser } from "@/lib/queries/orders";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your Orders",
  robots: { index: false, follow: false },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const { items, hasMore, nextCursor } = await getOrdersForUser(user.id, cursor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Your Orders</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                d="M6 8h12l-1 12H7L6 8Z M9 8V6a3 3 0 0 1 6 0v2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
          title="No orders yet"
          description="Once you place an order, it'll show up here with live status updates."
          ctaHref="/shop"
          ctaLabel="Start Shopping"
        />
      ) : (
        <ul className="flex flex-col divide-y divide-ink/10 rounded-xl border border-ink/10 bg-white/60">
          {items.map((order) => (
            <li key={order.orderNumber}>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ink/[0.03]"
              >
                <div>
                  <p className="font-medium text-ink">{order.orderNumber}</p>
                  <p className="text-xs text-ink/60">
                    {new Date(order.createdAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-medium text-ink">{formatPkr(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && nextCursor ? (
        <Link
          href={`/account/orders?cursor=${encodeURIComponent(nextCursor)}`}
          className="self-center text-sm font-medium text-terracotta hover:underline"
        >
          Older orders →
        </Link>
      ) : null}
    </div>
  );
}

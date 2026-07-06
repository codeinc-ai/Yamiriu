import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { getOrderDetailForUser, type OrderDetailItem } from "@/lib/queries/orders";
import { getCourierTrackingUrl } from "@/lib/courier/tracking-urls";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusTimeline } from "@/components/account/order-status-timeline";
import { RequestReturnButton } from "@/components/account/request-return-button";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
  card: "Card",
};

function groupItems(items: OrderDetailItem[]) {
  const standalone: OrderDetailItem[] = [];
  const groups = new Map<string, OrderDetailItem[]>();
  for (const item of items) {
    if (!item.outfitGroupId) {
      standalone.push(item);
      continue;
    }
    const group = groups.get(item.outfitGroupId) ?? [];
    group.push(item);
    groups.set(item.outfitGroupId, group);
  }
  return { standalone, groups: Array.from(groups.entries()) };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  // Ownership check happens inside the query itself (S-024) — a valid order
  // number belonging to someone else returns null here, identically to a
  // nonexistent one, so this 404s rather than leaking existence.
  const order = await getOrderDetailForUser(user.id, orderNumber);
  if (!order) notFound();

  const { standalone, groups } = groupItems(order.items);
  const trackingUrl = getCourierTrackingUrl(order.courierProvider, order.trackingNumber);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/account/orders" className="text-sm text-ink/60 hover:text-ink hover:underline">
          ← Back to orders
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="-mt-4 text-sm text-ink/60">
        Placed{" "}
        {new Date(order.createdAt).toLocaleDateString("en-PK", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      {order.trackingNumber ? (
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">Tracking</h2>
          <p className="mt-2 text-ink/80">
            {order.courierProvider ? `${order.courierProvider} · ` : ""}
            {trackingUrl ? (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-terracotta hover:underline"
              >
                {order.trackingNumber}
              </a>
            ) : (
              <span className="font-medium text-ink">{order.trackingNumber}</span>
            )}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-lg text-ink">Items</h2>
        <div className="mt-4 flex flex-col gap-4">
          {standalone.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  {item.quantity}× {item.productName}
                </p>
                <p className="text-xs text-ink/60">
                  {item.size} · {item.color}
                </p>
              </div>
              <p className="shrink-0 text-ink">{formatPkr(Number(item.priceAtPurchase) * item.quantity)}</p>
            </div>
          ))}

          {groups.map(([groupId, groupItems]) => (
            <div key={groupId} className="rounded-lg border border-terracotta/25 bg-terracotta/[0.04] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="terracotta">Outfit</Badge>
                <span className="text-xs text-ink/60">Styled together</span>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                {groupItems.map((item, i) => (
                  <div key={i} className="flex justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">
                        {item.quantity}× {item.productName}
                      </p>
                      <p className="text-xs text-ink/60">
                        {item.size} · {item.color}
                      </p>
                    </div>
                    <p className="shrink-0 text-ink">
                      {formatPkr(Number(item.priceAtPurchase) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <dl className="mt-5 flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd className="text-ink">{formatPkr(order.subtotal)}</dd>
          </div>
          {Number(order.discountAmount) > 0 ? (
            <div className="flex justify-between text-olive">
              <dt>Discount {order.discountCode ? `(${order.discountCode})` : ""}</dt>
              <dd>-{formatPkr(order.discountAmount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-ink/70">Shipping</dt>
            <dd className="text-ink">
              {Number(order.shippingCost) === 0 ? "Free" : formatPkr(order.shippingCost)}
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
          <span className="text-base font-semibold text-ink">Total</span>
          <span className="text-base font-semibold text-ink">{formatPkr(order.total)}</span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">Payment method</h2>
          <p className="mt-2 text-ink/80">
            {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </p>
        </div>
        <div className="rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <h2 className="font-display text-lg text-ink">Shipping address</h2>
          <p className="mt-2 text-ink/80">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
            <br />
            {order.shippingAddress.city}
            {order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ""}
          </p>
        </div>
      </div>

      {order.status === "delivered" ? (
        <div>
          <RequestReturnButton orderNumber={order.orderNumber} />
        </div>
      ) : null}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/queries/orders";
import { formatPkr } from "@/lib/format";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { BANK_TRANSFER_DETAILS } from "@/lib/bank-details";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ButtonLink } from "@/components/ui/button-link";
import { ClearCartOnMount } from "@/components/checkout/clear-cart-on-mount";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

function paymentNote(paymentMethod: string, status: string, total: string) {
  if (paymentMethod === "cod") {
    if (status === "pending_review") {
      return "Your order is being reviewed by our team before it's confirmed — we'll be in touch shortly.";
    }
    return `Your order is confirmed. Please have ${formatPkr(total)} ready for the courier on delivery.`;
  }
  if (paymentMethod === "bank_transfer") {
    return "Please transfer the total below to the account details listed. We'll confirm your order once payment is received.";
  }
  // jazzcash / easypaisa / card — the webhook is the source of truth, so
  // status may briefly still read pending_payment right after a successful
  // gateway redirect while it catches up.
  if (status === "confirmed") {
    return "Your payment was successful and your order is confirmed.";
  }
  return "We're confirming your payment now — this page will reflect it shortly. You can also check back via Track Order.";
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  const hasDiscount = Number(order.discountAmount) > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <ClearCartOnMount />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Order Confirmation" }]} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">
          Thank you for your order
        </h1>
        <span className="shrink-0 rounded-full bg-terracotta/10 px-3 py-1 text-xs font-medium text-terracotta">
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>
      <p className="mt-2 text-ink/70">
        Order <span className="font-medium text-ink">{order.orderNumber}</span> ·{" "}
        {new Date(order.createdAt).toLocaleDateString("en-PK", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      <p className="mt-6 rounded-md bg-olive/10 px-4 py-3 text-sm text-olive">
        {paymentNote(order.paymentMethod, order.status, order.total)}
      </p>

      {order.paymentMethod === "bank_transfer" ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <p>
            <strong>Bank:</strong> {BANK_TRANSFER_DETAILS.bankName}
          </p>
          <p className="mt-1">
            <strong>Account title:</strong> {BANK_TRANSFER_DETAILS.accountTitle}
          </p>
          <p className="mt-1">
            <strong>Account number:</strong> {BANK_TRANSFER_DETAILS.accountNumber}
          </p>
          <p className="mt-1">
            <strong>IBAN:</strong> {BANK_TRANSFER_DETAILS.iban}
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-ink/10 bg-white/60 p-6">
        <h2 className="font-display text-xl text-ink">Order summary</h2>
        <div className="mt-4 flex flex-col divide-y divide-ink/10">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-3 py-3 text-sm">
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

        <dl className="mt-4 flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd className="text-ink">{formatPkr(order.subtotal)}</dd>
          </div>
          {hasDiscount ? (
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

        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="text-base font-semibold text-ink">Total</span>
          <span className="text-base font-semibold text-ink">{formatPkr(order.total)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
        <h2 className="font-display text-lg text-ink">Shipping to</h2>
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

      <div className="mt-8 flex justify-center">
        <ButtonLink href="/shop">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}

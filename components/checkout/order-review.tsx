import { formatPkr } from "@/lib/format";
import type { CartLineDisplay } from "@/components/cart/cart-line-item";
import type { AppliedDiscount } from "@/actions/discounts";
import type { AppliedGiftCard } from "@/actions/gift-cards";

export function OrderReview({
  items,
  subtotal,
  discount,
  giftCard,
  giftCardAmount,
  shipping,
  total,
}: {
  items: CartLineDisplay[];
  subtotal: number;
  discount: AppliedDiscount | null;
  giftCard: AppliedGiftCard | null;
  giftCardAmount: number;
  shipping: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
      <h2 className="font-display text-xl text-ink">Order Review</h2>

      <div className="mt-4 flex flex-col divide-y divide-ink/10">
        {items.map((item) => (
          <div key={item.variantId} className="flex justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-medium text-ink">
                {item.quantity}× {item.name}
              </p>
              <p className="text-xs text-ink/60">
                {item.size} · {item.color}
              </p>
            </div>
            <p className="shrink-0 text-ink">{formatPkr(Number(item.price) * item.quantity)}</p>
          </div>
        ))}
      </div>

      <dl className="mt-4 flex flex-col gap-2 border-t border-ink/10 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/70">Subtotal</dt>
          <dd className="text-ink">{formatPkr(subtotal)}</dd>
        </div>
        {discount ? (
          <div className="flex justify-between text-olive">
            <dt>Discount ({discount.code})</dt>
            <dd>-{formatPkr(discount.amount)}</dd>
          </div>
        ) : null}
        {giftCard ? (
          <div className="flex justify-between text-olive">
            <dt>Gift card ({giftCard.code})</dt>
            <dd>-{formatPkr(giftCardAmount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-ink/70">Shipping</dt>
          <dd className="text-ink">{shipping === 0 ? "Free" : formatPkr(shipping)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
        <span className="text-base font-semibold text-ink">Total</span>
        <span className="text-base font-semibold text-ink">{formatPkr(total)}</span>
      </div>
    </div>
  );
}

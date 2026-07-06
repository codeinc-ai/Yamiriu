import { ButtonLink } from "@/components/ui/button-link";
import { formatPkr } from "@/lib/format";
import { COD_MAX_ORDER_VALUE } from "@/lib/checkout-config";
import { cn } from "@/lib/utils";
import type { AppliedDiscount } from "@/actions/discounts";
import type { AppliedGiftCard } from "@/actions/gift-cards";
import { DiscountForm } from "./discount-form";
import { GiftCardForm } from "./gift-card-form";

export function OrderSummary({
  subtotal,
  discount,
  discountPending,
  discountError,
  giftCard,
  giftCardAmount,
  giftCardPending,
  giftCardError,
  shipping,
  total,
  onApplyDiscount,
  onRemoveDiscount,
  onApplyGiftCard,
  onRemoveGiftCard,
}: {
  subtotal: number;
  discount: AppliedDiscount | null;
  discountPending: boolean;
  discountError: string | null;
  giftCard: AppliedGiftCard | null;
  giftCardAmount: number;
  giftCardPending: boolean;
  giftCardError: string | null;
  shipping: number;
  total: number;
  onApplyDiscount: (code: string) => void;
  onRemoveDiscount: () => void;
  onApplyGiftCard: (code: string) => void;
  onRemoveGiftCard: () => void;
}) {
  const codAvailable = total < COD_MAX_ORDER_VALUE;

  return (
    <div className="rounded-xl border border-ink/10 bg-white/60 p-6">
      <h2 className="font-display text-xl text-ink">Order Summary</h2>

      <div className="mt-4 flex flex-col gap-3">
        <DiscountForm
          applied={discount}
          pending={discountPending}
          error={discountError}
          onApply={onApplyDiscount}
          onRemove={onRemoveDiscount}
        />
        <GiftCardForm
          applied={giftCard}
          pending={giftCardPending}
          error={giftCardError}
          onApply={onApplyGiftCard}
          onRemove={onRemoveGiftCard}
        />
      </div>

      <dl className="mt-5 flex flex-col gap-2 text-sm">
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
          <dt className="text-ink/70">Shipping estimate</dt>
          <dd className="text-ink">{shipping === 0 ? "Free" : formatPkr(shipping)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
        <span className="text-base font-semibold text-ink">Total</span>
        <span className="text-base font-semibold text-ink">
          {formatPkr(total)}
        </span>
      </div>

      <p
        className={cn(
          "mt-4 rounded-md px-3 py-2.5 text-xs leading-relaxed",
          codAvailable ? "bg-olive/10 text-olive" : "bg-red-50 text-red-700"
        )}
      >
        {codAvailable
          ? `Cash on Delivery is available for this order (orders under ${formatPkr(COD_MAX_ORDER_VALUE)}).`
          : `Cash on Delivery isn't available for orders over ${formatPkr(COD_MAX_ORDER_VALUE)} — choose another payment method at checkout.`}
      </p>

      <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
        Proceed to Checkout
      </ButtonLink>
    </div>
  );
}

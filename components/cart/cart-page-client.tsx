"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCartStore, type CartItem } from "@/stores/cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { getCartLineData } from "@/actions/cart";
import { validateDiscountCode, type AppliedDiscount } from "@/actions/discounts";
import { validateGiftCardCode, type AppliedGiftCard } from "@/actions/gift-cards";
import { calculateShipping } from "@/lib/checkout-config";
import { EmptyCart } from "./empty-cart";
import { CartLineItem, type CartLineDisplay } from "./cart-line-item";
import { OutfitGroup } from "./outfit-group";
import { OrderSummary } from "./order-summary";

function enrichItems(
  items: CartItem[],
  liveData: Awaited<ReturnType<typeof getCartLineData>> | undefined
): CartLineDisplay[] {
  const liveByVariant = new Map((liveData ?? []).map((d) => [d.variantId, d]));
  return items.map((item) => {
    const live = liveByVariant.get(item.variantId);
    return {
      ...item,
      // Prefer live product name/price so the cart reflects current catalog
      // state, falling back to the add-time snapshot while data is loading.
      name: live?.productName ?? item.name,
      price: live?.price ?? item.price,
      liveStock: live?.stock ?? null,
      isAvailable: live ? live.available : true,
    };
  });
}

export function CartPageClient() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const discountCode = useCartStore((s) => s.discountCode);
  const giftCardCode = useCartStore((s) => s.giftCardCode);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const setDiscountCode = useCartStore((s) => s.setDiscountCode);
  const setGiftCardCode = useCartStore((s) => s.setGiftCardCode);

  const variantIds = useMemo(() => items.map((i) => i.variantId), [items]);

  const { data: liveData } = useQuery({
    queryKey: ["cart-line-data", variantIds],
    queryFn: () => getCartLineData(variantIds),
    enabled: hydrated && variantIds.length > 0,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const displayItems = useMemo(
    () => enrichItems(items, liveData),
    [items, liveData]
  );

  const subtotal = useMemo(
    () =>
      displayItems.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      ),
    [displayItems]
  );

  // Reconcile optimistic local quantities against live stock once it's known —
  // rolls back (clamps down, or removes if sold out) with an explanatory
  // toast if the server disagrees with what's in the cart (PRD FR-003).
  useEffect(() => {
    if (!liveData) return;
    for (const item of displayItems) {
      if (!item.isAvailable) {
        removeItem(item.variantId);
        toast.error(`${item.name} is no longer available and was removed from your cart.`);
      } else if (item.liveStock != null && item.quantity > item.liveStock) {
        if (item.liveStock <= 0) {
          removeItem(item.variantId);
          toast.error(`${item.name} just sold out and was removed from your cart.`);
        } else {
          updateQuantity(item.variantId, item.liveStock);
          toast.error(
            `Only ${item.liveStock} left of ${item.name} — quantity adjusted.`
          );
        }
      }
    }
    // Only re-run when the live data itself changes, not on every store update
    // (which would otherwise loop: this effect calls updateQuantity/removeItem).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData]);

  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(
    null
  );
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountPending, startDiscountTransition] = useTransition();

  // Re-validate a persisted discount code whenever the subtotal changes
  // (min-order-value thresholds, expiry, or usage limits may have shifted).
  // No-code / empty-cart case needs no setState here: `appliedDiscount`
  // defaults to null and is already cleared directly (not via this effect)
  // by handleRemoveDiscount and the invalid-code branch below.
  useEffect(() => {
    if (!discountCode || subtotal <= 0) {
      return;
    }
    let cancelled = false;
    startDiscountTransition(async () => {
      const result = await validateDiscountCode({ code: discountCode, subtotal });
      if (cancelled) return;
      if (result.ok && result.discount) {
        setAppliedDiscount(result.discount);
        setDiscountError(null);
      } else {
        setAppliedDiscount(null);
        setDiscountCode(null);
        toast.error(result.error ?? "Your discount code is no longer valid and was removed.");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountCode, subtotal]);

  function handleApplyDiscount(code: string) {
    setDiscountError(null);
    startDiscountTransition(async () => {
      const result = await validateDiscountCode({ code, subtotal });
      if (result.ok && result.discount) {
        setDiscountCode(result.discount.code);
        setAppliedDiscount(result.discount);
        toast.success(`Code ${result.discount.code} applied.`);
      } else {
        setDiscountError(result.error ?? "This code isn't valid.");
      }
    });
  }

  function handleRemoveDiscount() {
    setDiscountCode(null);
    setAppliedDiscount(null);
    setDiscountError(null);
  }

  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  const [giftCardError, setGiftCardError] = useState<string | null>(null);
  const [giftCardPending, startGiftCardTransition] = useTransition();

  // Same re-validation-on-change pattern as the discount code above.
  useEffect(() => {
    if (!giftCardCode || subtotal <= 0) {
      return;
    }
    let cancelled = false;
    startGiftCardTransition(async () => {
      const result = await validateGiftCardCode({ code: giftCardCode });
      if (cancelled) return;
      if (result.ok && result.giftCard) {
        setAppliedGiftCard(result.giftCard);
        setGiftCardError(null);
      } else {
        setAppliedGiftCard(null);
        setGiftCardCode(null);
        toast.error(result.error ?? "Your gift card is no longer valid and was removed.");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftCardCode, subtotal]);

  function handleApplyGiftCard(code: string) {
    setGiftCardError(null);
    startGiftCardTransition(async () => {
      const result = await validateGiftCardCode({ code });
      if (result.ok && result.giftCard) {
        setGiftCardCode(result.giftCard.code);
        setAppliedGiftCard(result.giftCard);
        toast.success(`Gift card ${result.giftCard.code} applied.`);
      } else {
        setGiftCardError(result.error ?? "This gift card isn't valid.");
      }
    });
  }

  function handleRemoveGiftCard() {
    setGiftCardCode(null);
    setAppliedGiftCard(null);
    setGiftCardError(null);
  }

  function handleQuantityChange(variantId: string, quantity: number) {
    // Optimistic: apply immediately. The reconciliation effect above rolls
    // this back if the live stock check (already in flight / cached) disagrees.
    updateQuantity(variantId, quantity);
  }

  function handleRemove(variantId: string) {
    removeItem(variantId);
    toast.success("Item removed from your cart.");
  }

  if (!hydrated) {
    return null;
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  const discountedSubtotal = Math.max(0, subtotal - (appliedDiscount?.amount ?? 0));
  const shipping = calculateShipping(discountedSubtotal);
  const preGiftCardTotal = discountedSubtotal + shipping;
  const giftCardAmount = appliedGiftCard ? Math.min(appliedGiftCard.balance, preGiftCardTotal) : 0;
  const total = Math.max(0, preGiftCardTotal - giftCardAmount);

  const standaloneItems = displayItems.filter((item) => !item.outfitGroupId);
  const outfitGroups = new Map<string, CartLineDisplay[]>();
  for (const item of displayItems) {
    if (!item.outfitGroupId) continue;
    const group = outfitGroups.get(item.outfitGroupId) ?? [];
    group.push(item);
    outfitGroups.set(item.outfitGroupId, group);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="divide-y divide-ink/10">
        {standaloneItems.map((item) => (
          <CartLineItem
            key={item.variantId}
            item={item}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
        ))}
        {Array.from(outfitGroups.entries()).map(([groupId, groupItems]) => (
          <div key={groupId} className="py-5">
            <OutfitGroup
              items={groupItems}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
            />
          </div>
        ))}
      </div>

      <div>
        <OrderSummary
          subtotal={subtotal}
          discount={appliedDiscount}
          discountPending={discountPending}
          discountError={discountError}
          giftCard={appliedGiftCard}
          giftCardAmount={giftCardAmount}
          giftCardPending={giftCardPending}
          giftCardError={giftCardError}
          shipping={shipping}
          total={total}
          onApplyDiscount={handleApplyDiscount}
          onRemoveDiscount={handleRemoveDiscount}
          onApplyGiftCard={handleApplyGiftCard}
          onRemoveGiftCard={handleRemoveGiftCard}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import { useHydrated } from "@/hooks/use-hydrated";
import { getCartLineData } from "@/actions/cart";
import { validateDiscountCode, type AppliedDiscount } from "@/actions/discounts";
import { validateGiftCardCode, type AppliedGiftCard } from "@/actions/gift-cards";
import { placeOrder } from "@/actions/checkout";
import { calculateShipping, COD_MAX_ORDER_VALUE } from "@/lib/checkout-config";
import { capture } from "@/lib/analytics";
import type { PaymentMethod, RedirectFormSpec } from "@/lib/payments";
import type { Address } from "@/db/schema";
import { EmptyCart } from "@/components/cart/empty-cart";
import type { CartLineDisplay } from "@/components/cart/cart-line-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { AddressBook } from "./address-book";
import { AddressForm } from "./address-form";
import { PaymentMethodSelector } from "./payment-method-selector";
import { OrderReview } from "./order-review";
import { AutoSubmitRedirectForm } from "./auto-submit-redirect-form";
import { buildCheckoutFormSchema, type CheckoutFormValues } from "./checkout-form-schema";

export function CheckoutPageClient({
  isLoggedIn,
  savedAddresses,
}: {
  isLoggedIn: boolean;
  savedAddresses: Address[];
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCartStore((s) => s.items);
  const discountCode = useCartStore((s) => s.discountCode);
  const giftCardCode = useCartStore((s) => s.giftCardCode);
  const clearCart = useCartStore((s) => s.clear);

  const checkoutStartedFired = useRef(false);
  useEffect(() => {
    if (!hydrated || items.length === 0 || checkoutStartedFired.current) return;
    checkoutStartedFired.current = true;
    capture("checkout_started", { itemCount: items.length });
  }, [hydrated, items.length]);

  const variantIds = useMemo(() => items.map((i) => i.variantId), [items]);
  const { data: liveData } = useQuery({
    queryKey: ["cart-line-data", variantIds],
    queryFn: () => getCartLineData(variantIds),
    enabled: hydrated && variantIds.length > 0,
    staleTime: 30_000,
  });

  const displayItems: CartLineDisplay[] = useMemo(() => {
    const liveByVariant = new Map((liveData ?? []).map((d) => [d.variantId, d]));
    return items.map((item) => {
      const live = liveByVariant.get(item.variantId);
      return {
        ...item,
        name: live?.productName ?? item.name,
        price: live?.price ?? item.price,
        liveStock: live?.stock ?? null,
        isAvailable: live ? live.available : true,
      };
    });
  }, [items, liveData]);

  const subtotal = useMemo(
    () => displayItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [displayItems]
  );

  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!discountCode || subtotal <= 0) {
        if (!cancelled) setAppliedDiscount(null);
        return;
      }
      const result = await validateDiscountCode({ code: discountCode, subtotal });
      if (cancelled) return;
      setAppliedDiscount(result.ok && result.discount ? result.discount : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [discountCode, subtotal]);

  const [appliedGiftCard, setAppliedGiftCard] = useState<AppliedGiftCard | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!giftCardCode || subtotal <= 0) {
        if (!cancelled) setAppliedGiftCard(null);
        return;
      }
      const result = await validateGiftCardCode({ code: giftCardCode });
      if (cancelled) return;
      setAppliedGiftCard(result.ok && result.giftCard ? result.giftCard : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [giftCardCode, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - (appliedDiscount?.amount ?? 0));
  const shipping = calculateShipping(discountedSubtotal);
  const preGiftCardTotal = discountedSubtotal + shipping;
  const giftCardAmount = appliedGiftCard ? Math.min(appliedGiftCard.balance, preGiftCardTotal) : 0;
  const total = Math.max(0, preGiftCardTotal - giftCardAmount);
  const codAvailable = total <= COD_MAX_ORDER_VALUE;

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const schema = useMemo(() => buildCheckoutFormSchema(isLoggedIn), [isLoggedIn]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      addressMode: defaultAddress ? "saved" : "new",
      addressId: defaultAddress?.id,
      address: {
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        province: "",
        postalCode: "",
      },
      saveAddress: false,
      paymentMethod: "cod",
      guestEmail: "",
    },
  });

  const addressMode = useWatch({ control, name: "addressMode" });
  const selectedAddressId = useWatch({ control, name: "addressId" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  // If a discount or stock change pushes the order over the COD ceiling,
  // don't leave an order silently submittable with a now-invalid method.
  useEffect(() => {
    if (!codAvailable && paymentMethod === "cod") {
      setValue("paymentMethod", "bank_transfer");
    }
  }, [codAvailable, paymentMethod, setValue]);

  const [formError, setFormError] = useState<string | null>(null);
  const [redirectForm, setRedirectForm] = useState<RedirectFormSpec | null>(null);
  const [pending, startTransition] = useTransition();

  // A declined/abandoned hosted-checkout attempt lands back here via
  // /api/payments/{provider}/return — the cart was deliberately never
  // cleared for that path, so it's still intact for a retry (FR-007).
  useEffect(() => {
    (async () => {
      if (searchParams.get("paymentFailed") === "1") {
        setFormError(
          "Your payment wasn't completed. Please try again or choose a different payment method."
        );
      }
    })();
  }, [searchParams]);

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          outfitGroupId: item.outfitGroupId,
        })),
        addressId: values.addressMode === "saved" ? values.addressId : undefined,
        address: values.addressMode === "new" ? values.address : undefined,
        saveAddress: values.addressMode === "new" ? values.saveAddress : false,
        paymentMethod: values.paymentMethod,
        discountCode: appliedDiscount?.code,
        giftCardCode: appliedGiftCard?.code,
        guestEmail: isLoggedIn ? undefined : values.guestEmail,
      });

      if (!result.ok) {
        setFormError(result.error ?? "Something went wrong. Please try again.");
        toast.error(result.error ?? "Something went wrong. Please try again.");
        return;
      }

      if (result.redirectForm) {
        // Don't clear the cart yet — it stays intact until payment is
        // actually confirmed, so a decline can retry with cart untouched.
        setRedirectForm(result.redirectForm);
        return;
      }

      if (result.redirectUrl) {
        capture("order_placed", {
          paymentMethod: values.paymentMethod,
          itemCount: items.length,
          total,
        });
        clearCart();
        router.push(result.redirectUrl);
      }
    });
  });

  if (!hydrated) {
    return null;
  }

  if (redirectForm) {
    return <AutoSubmitRedirectForm actionUrl={redirectForm.actionUrl} fields={redirectForm.fields} />;
  }

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        {formError ? <FormAlert variant="error">{formError}</FormAlert> : null}

        {!isLoggedIn ? (
          <section>
            <h2 className="font-display text-xl text-ink">Contact</h2>
            <div className="mt-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                error={errors.guestEmail?.message}
                {...register("guestEmail")}
              />
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-xl text-ink">Shipping address</h2>
          <div className="mt-4">
            {savedAddresses.length > 0 ? (
              <AddressBook
                addresses={savedAddresses}
                mode={addressMode}
                selectedAddressId={selectedAddressId ?? null}
                onSelectSaved={(addressId) => {
                  setValue("addressMode", "saved");
                  setValue("addressId", addressId);
                }}
                onSelectNew={() => setValue("addressMode", "new")}
              />
            ) : null}
            {addressMode === "new" ? (
              <div className={savedAddresses.length > 0 ? "mt-5" : undefined}>
                <AddressForm register={register} errors={errors.address} />
                {isLoggedIn ? (
                  <label className="mt-4 flex items-center gap-2 text-sm text-ink/80">
                    <input type="checkbox" {...register("saveAddress")} />
                    Save this address for next time
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Payment method</h2>
          <div className="mt-4">
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={(method: PaymentMethod) => setValue("paymentMethod", method)}
              codAvailable={codAvailable}
            />
          </div>
        </section>

        <Button type="submit" size="lg" loading={pending} className="lg:hidden">
          Place Order
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <OrderReview
          items={displayItems}
          subtotal={subtotal}
          discount={appliedDiscount}
          giftCard={appliedGiftCard}
          giftCardAmount={giftCardAmount}
          shipping={shipping}
          total={total}
        />
        <Button type="submit" size="lg" loading={pending} className="hidden w-full lg:flex">
          Place Order
        </Button>
      </div>
    </form>
  );
}

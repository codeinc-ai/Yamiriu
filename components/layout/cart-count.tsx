"use client";

import { useCartStore, selectCartCount } from "@/stores/cart";
import { useHydrated } from "@/hooks/use-hydrated";

/** Live cart item count. Renders 0 until hydrated to avoid SSR mismatch. */
export function CartCount() {
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const display = hydrated ? count : 0;
  if (display <= 0) return null;
  return (
    <span
      className="absolute -right-2 -top-2 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-semibold leading-none text-cream"
      aria-hidden="true"
    >
      {display > 99 ? "99+" : display}
    </span>
  );
}

/** Accessible label text for the cart trigger, e.g. "Cart, 3 items". */
export function useCartLabel(): string {
  const hydrated = useHydrated();
  const count = useCartStore(selectCartCount);
  const n = hydrated ? count : 0;
  return n > 0 ? `Cart, ${n} item${n === 1 ? "" : "s"}` : "Cart, empty";
}

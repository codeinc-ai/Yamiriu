"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";

/**
 * The confirmation page can be reached two ways: (1) checkout-page-client
 * already cleared the cart before navigating here (cod/bank_transfer), or
 * (2) the browser round-tripped through a payment gateway's hosted checkout
 * and landed here via a server redirect (jazzcash/easypaisa/card), in which
 * case the cart was deliberately left untouched until now. Clearing
 * unconditionally on mount covers both — a no-op if it's already empty.
 */
export function ClearCartOnMount() {
  const clear = useCartStore((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

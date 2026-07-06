"use client";

import { useEffect } from "react";
import { capture } from "@/lib/analytics";

/** Fires `product_viewed` once per PDP mount (BLOCK 10) — no PII, product
 * identifiers only (S-023). */
export function ProductViewTracker({
  productId,
  category,
}: {
  productId: string;
  category: string;
}) {
  useEffect(() => {
    capture("product_viewed", { productId, category });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return null;
}

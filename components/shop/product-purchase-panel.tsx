"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import { buttonClasses } from "@/components/ui/button";
import { colorSwatchHex } from "@/lib/color-swatches";
import { formatPkr } from "@/lib/format";
import { capture } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface VariantOption {
  id: string;
  size: string;
  color: string;
  stock: number;
}

export function ProductPurchasePanel({
  productId,
  productSlug,
  productName,
  productCategory,
  price,
  variants,
}: {
  productId: string;
  productSlug: string;
  productName: string;
  productCategory: "men" | "women" | "kids";
  price: string;
  variants: VariantOption[];
}) {
  const sizes = useMemo(() => Array.from(new Set(variants.map((v) => v.size))), [variants]);
  const colors = useMemo(
    () => Array.from(new Set(variants.map((v) => v.color))),
    [variants]
  );

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  function findVariant(size: string | null, color: string | null) {
    if (!size || !color) return undefined;
    return variants.find((v) => v.size === size && v.color === color);
  }

  const selectedVariant = findVariant(selectedSize, selectedColor);

  // Reset quantity when the resolved variant changes, without an effect:
  // adjusting state during render (React's endorsed pattern for "derived
  // state that depends on a prop/value changing") avoids an extra commit.
  const [quantityResetKey, setQuantityResetKey] = useState(selectedVariant?.id);
  if (selectedVariant?.id !== quantityResetKey) {
    setQuantityResetKey(selectedVariant?.id);
    setQuantity(1);
  }

  // A size/color option is unselectable once it would resolve to a
  // nonexistent or 0-stock variant, given the other dimension already chosen.
  function isSizeDisabled(size: string): boolean {
    if (!selectedColor) return false;
    const variant = findVariant(size, selectedColor);
    return !variant || variant.stock <= 0;
  }
  function isColorDisabled(color: string): boolean {
    if (!selectedSize) return false;
    const variant = findVariant(selectedSize, color);
    return !variant || variant.stock <= 0;
  }

  const canAddToCart = Boolean(selectedVariant) && selectedVariant!.stock > 0;

  const stockLabel = !selectedVariant
    ? "Select a size and color"
    : selectedVariant.stock <= 0
      ? "Out of stock"
      : selectedVariant.stock <= 5
        ? `Only ${selectedVariant.stock} left`
        : "In stock";

  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Sticky mobile "Add to Cart" bar once the main CTA scrolls out of view
  // (PRD 10.3).
  useEffect(() => {
    const el = mainButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleAddToCart() {
    if (!selectedVariant) return;
    addItem({
      variantId: selectedVariant.id,
      productId,
      slug: productSlug,
      name: productName,
      category: productCategory,
      price,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity,
    });
    capture("add_to_cart", { productId, category: productCategory, quantity });
    toast.success(
      `Added to cart — ${productName} (${selectedVariant.size}, ${selectedVariant.color})`
    );
  }

  const ctaLabel = `Add to Cart — ${formatPkr(price)}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold text-ink">
          Color{selectedColor ? `: ${selectedColor}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {colors.map((color) => {
            const disabled = isColorDisabled(color);
            const active = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                aria-label={color}
                title={disabled ? `${color} — unavailable` : color}
                onClick={() => setSelectedColor(active ? null : color)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border-2 transition-colors",
                  active ? "border-terracotta" : "border-transparent",
                  disabled && "cursor-not-allowed opacity-30"
                )}
              >
                <span
                  className="size-6 rounded-full border border-ink/15"
                  style={{ backgroundColor: colorSwatchHex(color) }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">
          Size{selectedSize ? `: ${selectedSize}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const disabled = isSizeDisabled(size);
            const active = selectedSize === size;
            return (
              <button
                key={size}
                type="button"
                disabled={disabled}
                aria-pressed={active}
                title={disabled ? `${size} — unavailable in this color` : size}
                onClick={() => setSelectedSize(active ? null : size)}
                className={cn(
                  "min-w-[44px] rounded-md border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-ink/20 text-ink hover:bg-ink/5",
                  disabled &&
                    "cursor-not-allowed border-ink/10 text-ink/30 line-through hover:bg-transparent"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      <p
        role="status"
        className={cn(
          "text-sm",
          selectedVariant && selectedVariant.stock > 0
            ? "text-olive"
            : "text-ink/60"
        )}
      >
        {stockLabel}
      </p>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">Quantity</span>
        <div className="flex items-center rounded-md border border-ink/20">
          <button
            type="button"
            disabled={!canAddToCart || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
            className="flex size-11 items-center justify-center text-ink disabled:opacity-30"
          >
            −
          </button>
          <span className="w-8 text-center text-sm text-ink" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            disabled={!canAddToCart || quantity >= (selectedVariant?.stock ?? 1)}
            onClick={() =>
              setQuantity((q) => Math.min(selectedVariant?.stock ?? 1, q + 1))
            }
            aria-label="Increase quantity"
            className="flex size-11 items-center justify-center text-ink disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      <button
        ref={mainButtonRef}
        type="button"
        disabled={!canAddToCart}
        onClick={handleAddToCart}
        className={buttonClasses({ size: "lg", className: "w-full" })}
      >
        {ctaLabel}
      </button>

      {showStickyBar ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream/95 p-4 backdrop-blur md:hidden">
          <button
            type="button"
            disabled={!canAddToCart}
            onClick={handleAddToCart}
            className={buttonClasses({ size: "lg", className: "w-full" })}
          >
            {ctaLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

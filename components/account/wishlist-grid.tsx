"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { removeFromWishlist } from "@/actions/wishlist";
import { fetchProductVariantsForOutfit, type VariantOption } from "@/actions/outfit-builder";
import { getProductThumbnail } from "@/lib/product-images";
import { formatPkr } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";
import type { WishlistProduct } from "@/lib/queries/wishlist";

export function WishlistGrid({ products }: { products: WishlistProduct[] }) {
  const [items, setItems] = useState(products);
  const [moveTarget, setMoveTarget] = useState<WishlistProduct | null>(null);
  const [variants, setVariants] = useState<VariantOption[] | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const removeWishlistId = useWishlistStore((s) => s.remove);

  async function handleRemove(productId: string) {
    setItems((prev) => prev.filter((p) => p.id !== productId));
    removeWishlistId(productId);
    const result = await removeFromWishlist({ productId });
    if (!result.ok) {
      toast.error("Couldn't remove that item. Please try again.");
      return;
    }
    toast.success("Removed from wishlist.");
  }

  async function openMoveToCart(product: WishlistProduct) {
    setMoveTarget(product);
    setVariants(null);
    setSelectedVariantId(null);
    setLoadingVariants(true);
    const result = await fetchProductVariantsForOutfit([product.id]);
    setVariants(result[product.id] ?? []);
    setLoadingVariants(false);
  }

  function confirmMoveToCart() {
    if (!moveTarget || !selectedVariantId || !variants) return;
    const variant = variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    addItem({
      variantId: variant.id,
      productId: moveTarget.id,
      slug: moveTarget.slug,
      name: moveTarget.name,
      category: moveTarget.category,
      price: moveTarget.price,
      size: variant.size,
      color: variant.color,
    });
    void handleRemove(moveTarget.id);
    toast.success(`${moveTarget.name} added to your cart.`);
    setMoveTarget(null);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5 6 5c2 0 3.5 1 6 3.5C14.5 6 16 5 18 5c3.5 0 5 3.5 3.5 6.5C19 15.65 12 20 12 20Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Your wishlist is empty"
        description="Save pieces you love here so you can find them again later."
        ctaHref="/shop"
        ctaLabel="Browse Products"
      />
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((product) => (
          <li key={product.id} className="flex flex-col gap-2">
            <Link
              href={`/product/${product.slug}`}
              className="relative aspect-[3/4] overflow-hidden rounded-lg bg-ink/5"
            >
              <Image
                src={getProductThumbnail(product)}
                alt={product.name}
                fill
                unoptimized
                sizes="200px"
                className="object-cover"
              />
            </Link>
            <div>
              <Link
                href={`/product/${product.slug}`}
                className="text-sm font-medium text-ink hover:underline"
              >
                {product.name}
              </Link>
              <p className="text-sm text-ink/60">{formatPkr(product.price)}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1" onClick={() => openMoveToCart(product)}>
                Move to Cart
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleRemove(product.id)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        title="Select a size"
        description={moveTarget?.name}
      >
        {loadingVariants ? (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-ink/40" />
          </div>
        ) : variants && variants.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.stock <= 0}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "min-h-[44px] rounded-md border px-3 py-2 text-sm transition-colors",
                    selectedVariantId === variant.id
                      ? "border-terracotta bg-terracotta/5 text-ink"
                      : "border-ink/20 text-ink/80 hover:border-ink/40",
                    variant.stock <= 0 && "cursor-not-allowed opacity-40"
                  )}
                >
                  {variant.size}
                  {variant.stock <= 0 ? " (Out of stock)" : ""}
                </button>
              ))}
            </div>
            <Button type="button" disabled={!selectedVariantId} onClick={confirmMoveToCart}>
              Add to Cart
            </Button>
          </div>
        ) : (
          <p className="text-sm text-ink/60">No sizes are currently available for this item.</p>
        )}
      </Modal>
    </>
  );
}

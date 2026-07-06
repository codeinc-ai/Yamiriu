"use client";

import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { getProductThumbnail } from "@/lib/product-images";
import { formatPkr } from "@/lib/format";
import { outfitSlotLabel } from "@/lib/outfit-builder-config";
import { cn } from "@/lib/utils";
import type { OutfitBuilderProduct, OutfitSlot } from "@/lib/queries/outfit-builder";
import type { ModelLoadStatus } from "@/stores/outfit-builder";

export function ProductStrip({
  slot,
  products,
  isLoading,
  selectedProductId,
  garmentStatus,
  onSelect,
  onDeselect,
  onRetryGarment,
}: {
  slot: OutfitSlot;
  products: OutfitBuilderProduct[];
  isLoading: boolean;
  selectedProductId: string | null;
  garmentStatus?: ModelLoadStatus;
  onSelect: (product: OutfitBuilderProduct) => void;
  onDeselect: () => void;
  onRetryGarment: () => void;
}) {
  return (
    <div role="tabpanel" id={`outfit-tabpanel-${slot}`} aria-labelledby={`outfit-tab-${slot}`}>
      {isLoading ? (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="w-28 shrink-0">
              <Skeleton className="aspect-square w-28 rounded-lg" />
            </li>
          ))}
        </ul>
      ) : products.length === 0 ? (
        <p className="mt-4 text-sm text-ink/60">
          No {outfitSlotLabel(slot).toLowerCase()} items available yet for this avatar.
        </p>
      ) : (
        <ul className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
          {products.map((product) => {
            const selected = selectedProductId === product.id;
            const status = selected ? garmentStatus : undefined;
            return (
              <li key={product.id} className="w-28 shrink-0 snap-start">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => (selected ? onDeselect() : onSelect(product))}
                    aria-pressed={selected}
                    className="block w-full text-left"
                  >
                    <div
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-lg border-2 bg-ink/5 transition-colors",
                        selected ? "border-terracotta" : "border-transparent hover:border-ink/15"
                      )}
                    >
                      <Image
                        src={getProductThumbnail(product)}
                        alt={product.name}
                        fill
                        unoptimized
                        sizes="112px"
                        className="object-cover"
                      />
                      {status === "loading" ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                          <Spinner className="size-5 text-cream" />
                        </div>
                      ) : null}
                      {!product.inStock ? (
                        <Badge className="absolute left-1 top-1 bg-red-50 text-red-700">
                          Out of stock
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-ink">{product.name}</p>
                    <p className="text-xs text-ink/60">{formatPkr(product.price)}</p>
                  </button>
                  {status === "error" ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRetryGarment();
                      }}
                      className="absolute bottom-9 right-1 z-10 rounded-full bg-white px-2 py-1 text-[10px] font-medium text-ink shadow"
                    >
                      3D failed · Retry
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

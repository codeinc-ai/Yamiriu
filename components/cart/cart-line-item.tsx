import Image from "next/image";
import Link from "next/link";
import { formatPkr } from "@/lib/format";
import { getProductThumbnail } from "@/lib/product-images";
import type { CartItem } from "@/stores/cart";

export interface CartLineDisplay extends CartItem {
  /** Live stock for this variant, or null while loading / if the lookup failed. */
  liveStock: number | null;
  /** False once we've confirmed the variant/product no longer exists. */
  isAvailable: boolean;
}

export function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartLineDisplay;
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  const maxQuantity = item.liveStock ?? undefined;
  const lineTotal = Number(item.price) * item.quantity;

  return (
    <div className="flex gap-4 py-5">
      <Link
        href={`/product/${item.slug}`}
        className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-ink/5"
      >
        <Image
          src={getProductThumbnail(item)}
          alt={item.name}
          fill
          unoptimized
          sizes="96px"
          className="object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/product/${item.slug}`}
              className="text-sm font-medium text-ink hover:underline"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-xs text-ink/60">
              {item.size} · {item.color}
            </p>
            {!item.isAvailable ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                No longer available
              </p>
            ) : item.liveStock != null && item.liveStock < item.quantity ? (
              <p className="mt-1 text-xs font-medium text-red-600">
                Only {item.liveStock} left in stock
              </p>
            ) : null}
          </div>
          <p className="shrink-0 text-sm font-medium text-ink">
            {formatPkr(lineTotal)}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center rounded-md border border-ink/20">
            <button
              type="button"
              disabled={!item.isAvailable || item.quantity <= 1}
              onClick={() => onQuantityChange(item.variantId, item.quantity - 1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
            >
              −
            </button>
            <span
              className="w-8 text-center text-sm text-ink"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              type="button"
              disabled={
                !item.isAvailable ||
                (maxQuantity != null && item.quantity >= maxQuantity)
              }
              onClick={() => onQuantityChange(item.variantId, item.quantity + 1)}
              aria-label={`Increase quantity of ${item.name}`}
              className="flex size-9 items-center justify-center text-ink disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.variantId)}
            className="text-xs text-ink/60 underline-offset-2 hover:text-terracotta hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

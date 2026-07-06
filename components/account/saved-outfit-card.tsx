"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Badge } from "@/components/ui/badge";
import type { SavedOutfitListItem } from "@/lib/queries/saved-outfits";

export function SavedOutfitCard({
  outfit,
  addToCartPending,
  onAddToCart,
  onRename,
  onDelete,
}: {
  outfit: SavedOutfitListItem;
  addToCartPending: boolean;
  onAddToCart: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white/60">
      <div className="relative aspect-square w-full bg-ink/5">
        {outfit.thumbnailUrl ? (
          <Image
            src={outfit.thumbnailUrl}
            alt={outfit.name ?? "Saved outfit"}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-ink/40">
            No preview
          </div>
        )}
        {outfit.hasOutOfStockItem ? (
          <Badge className="absolute left-2 top-2 bg-red-50 text-red-700">
            Item(s) out of stock
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-medium text-ink">{outfit.name || "Untitled outfit"}</p>
        <p className="text-xs text-ink/60">
          {new Date(outfit.createdAt).toLocaleDateString("en-PK", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}{" "}
          · {outfit.itemCount} item{outfit.itemCount === 1 ? "" : "s"}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button type="button" size="sm" onClick={onAddToCart} loading={addToCartPending}>
            Add to Cart
          </Button>
          <ButtonLink href={`/outfit-builder?outfit=${outfit.id}`} variant="secondary" size="sm">
            Edit in Builder
          </ButtonLink>
          <Button type="button" size="sm" variant="secondary" onClick={onRename}>
            Rename
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatPkr } from "@/lib/format";
import { fetchProductVariantsForOutfit } from "@/actions/outfit-builder";
import { outfitSlotLabel } from "@/lib/outfit-builder-config";
import type { OutfitItem } from "@/stores/outfit-builder";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";

export interface VariantPickerConfirmItem {
  slot: OutfitSlot;
  productId: string;
  variantId: string;
}

/**
 * Compact per-item size picker shown before an outfit selection (product-
 * level, no size yet) becomes concrete cart/saved-outfit lines (PRD 4.7).
 * Shared by "Add All to Cart" and "Save Outfit" — `mode` only changes the
 * copy/confirm action and whether a name field is shown.
 */
export function VariantPickerModal({
  open,
  onClose,
  items,
  mode,
  pending,
  onConfirm,
  initialName,
}: {
  open: boolean;
  onClose: () => void;
  items: Array<{ slot: OutfitSlot; item: OutfitItem }>;
  mode: "cart" | "save";
  pending: boolean;
  onConfirm: (selected: VariantPickerConfirmItem[], name: string) => void;
  initialName?: string;
}) {
  const productIds = items.map(({ item }) => item.productId);
  const { data: variantsByProduct, isLoading } = useQuery({
    queryKey: ["outfit-variant-options", productIds],
    queryFn: () => fetchProductVariantsForOutfit(productIds),
    enabled: open && productIds.length > 0,
  });

  const [chosen, setChosen] = useState<Partial<Record<OutfitSlot, string>>>({});
  const [name, setName] = useState("");

  // Default each slot to its first in-stock variant once options load.
  useEffect(() => {
    (async () => {
      if (!variantsByProduct) return;
      setChosen((prev) => {
        const next = { ...prev };
        for (const { slot, item } of items) {
          if (next[slot]) continue;
          const options = variantsByProduct[item.productId] ?? [];
          const firstInStock = options.find((option) => option.stock > 0);
          if (firstInStock) next[slot] = firstInStock.id;
        }
        return next;
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantsByProduct]);

  // Reset transient picker state each time the modal is reopened for a new set of items.
  useEffect(() => {
    (async () => {
      if (open) {
        setChosen({});
        setName(initialName ?? "");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectableCount = items.filter(({ item }) => {
    const options = variantsByProduct?.[item.productId] ?? [];
    return options.some((option) => option.stock > 0);
  }).length;

  function handleConfirm() {
    const selected: VariantPickerConfirmItem[] = [];
    for (const { slot, item } of items) {
      const variantId = chosen[slot];
      if (!variantId) continue;
      selected.push({ slot, productId: item.productId, variantId });
    }
    onConfirm(selected, name.trim());
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "save" ? "Save this outfit" : "Choose sizes"}
      description={
        mode === "save"
          ? "Pick a size for each item, then give your outfit a name (optional)."
          : "Pick a size for each item before adding them to your cart."
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-6 text-ink/40" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map(({ slot, item }) => {
            const options = variantsByProduct?.[item.productId] ?? [];
            const inStockOptions = options.filter((option) => option.stock > 0);
            return (
              <div
                key={slot}
                className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink/60">
                    {outfitSlotLabel(slot)} · {formatPkr(item.price)}
                  </p>
                </div>
                {inStockOptions.length === 0 ? (
                  <span className="shrink-0 text-xs font-medium text-red-600">Out of stock</span>
                ) : (
                  <select
                    aria-label={`Size for ${item.name}`}
                    value={chosen[slot] ?? ""}
                    onChange={(event) =>
                      setChosen((prev) => ({ ...prev, [slot]: event.target.value }))
                    }
                    className="h-10 shrink-0 rounded-md border border-ink/20 bg-white px-2 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                  >
                    {inStockOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.size}
                        {option.color ? ` · ${option.color}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}

          {mode === "save" ? (
            <Input
              label="Outfit name (optional)"
              placeholder="e.g. Weekend brunch"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
            />
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              loading={pending}
              disabled={selectableCount === 0}
            >
              {mode === "save" ? "Save Outfit" : "Add to Cart"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

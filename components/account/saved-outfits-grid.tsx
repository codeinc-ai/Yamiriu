"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useCartStore } from "@/stores/cart";
import { deleteSavedOutfit, renameSavedOutfit, validateOutfitVariants } from "@/actions/outfit-builder";
import { capture } from "@/lib/analytics";
import type { SavedOutfitListItem } from "@/lib/queries/saved-outfits";
import { SavedOutfitCard } from "./saved-outfit-card";

export function SavedOutfitsGrid({ initialOutfits }: { initialOutfits: SavedOutfitListItem[] }) {
  const router = useRouter();
  const addItemToCart = useCartStore((s) => s.addItem);

  const [outfits, setOutfits] = useState(initialOutfits);
  const [deleteTarget, setDeleteTarget] = useState<SavedOutfitListItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SavedOutfitListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamePending, setRenamePending] = useState(false);
  const [addToCartPendingId, setAddToCartPendingId] = useState<string | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletePending(true);
    const result = await deleteSavedOutfit(deleteTarget.id);
    setDeletePending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    setOutfits((prev) => prev.filter((outfit) => outfit.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Outfit deleted.");
  }

  async function handleRename() {
    if (!renameTarget) return;
    setRenamePending(true);
    const result = await renameSavedOutfit({ outfitId: renameTarget.id, name: renameValue });
    setRenamePending(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    const trimmed = renameValue.trim() || null;
    setOutfits((prev) =>
      prev.map((outfit) => (outfit.id === renameTarget.id ? { ...outfit, name: trimmed } : outfit))
    );
    setRenameTarget(null);
    toast.success("Outfit renamed.");
  }

  async function handleAddToCart(outfit: SavedOutfitListItem) {
    setAddToCartPendingId(outfit.id);
    const result = await validateOutfitVariants(
      outfit.items.map((item) => ({ slot: item.slot, variantId: item.variantId }))
    );
    setAddToCartPendingId(null);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    const succeeded = result.items.filter((item) => item.ok);
    const failed = result.items.filter((item) => !item.ok);

    if (succeeded.length === 0) {
      toast.error("None of the items in this outfit are available right now.");
      return;
    }

    const outfitGroupId = crypto.randomUUID();
    for (const item of succeeded) {
      addItemToCart({
        variantId: item.variantId,
        productId: item.productId!,
        slug: item.productSlug!,
        name: item.productName!,
        category: item.category!,
        price: item.price!,
        size: item.size!,
        color: item.color!,
        outfitGroupId,
      });
    }

    capture("outfit_added_to_cart", { avatarType: outfit.avatarType, itemCount: succeeded.length });

    if (failed.length > 0) {
      toast.warning(
        `${failed
          .map((item) => `${item.productName ?? "An item"} — ${item.reason ?? "unavailable"}`)
          .join("; ")}. The rest were added to your cart.`,
        { action: { label: "View Cart", onClick: () => router.push("/cart") } }
      );
    } else {
      toast.success("Added to your cart.", {
        action: { label: "View Cart", onClick: () => router.push("/cart") },
        cancel: { label: "Keep Browsing", onClick: () => {} },
      });
    }
  }

  if (outfits.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M9 4h6l1 3 4 1.5-2 3.5h-3v8H9v-8H6l-2-3.5L8 7l1-3Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="No saved outfits yet"
        description="Build a look in the Outfit Builder and save it to see it here."
        ctaHref="/outfit-builder"
        ctaLabel="Open the Outfit Builder"
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {outfits.map((outfit) => (
          <SavedOutfitCard
            key={outfit.id}
            outfit={outfit}
            addToCartPending={addToCartPendingId === outfit.id}
            onAddToCart={() => handleAddToCart(outfit)}
            onRename={() => {
              setRenameTarget(outfit);
              setRenameValue(outfit.name ?? "");
            }}
            onDelete={() => setDeleteTarget(outfit)}
          />
        ))}
      </div>

      <Modal open={renameTarget !== null} onClose={() => setRenameTarget(null)} title="Rename outfit">
        <div className="flex flex-col gap-4">
          <Input
            label="Outfit name"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            maxLength={80}
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRenameTarget(null)}
              disabled={renamePending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRename} loading={renamePending}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete this outfit?"
        description="This can't be undone."
        confirmLabel="Delete"
        loading={deletePending}
      />
    </>
  );
}

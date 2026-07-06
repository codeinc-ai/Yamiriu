"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOutfitBuilderStore, type OutfitItem } from "@/stores/outfit-builder";
import { useCartStore } from "@/stores/cart";
import {
  fetchOutfitBuilderProducts,
  saveOutfit,
  validateOutfitVariants,
} from "@/actions/outfit-builder";
import { captureCurrentThumbnailDataUrl, uploadOutfitThumbnail } from "@/lib/outfit-thumbnail";
import { capture } from "@/lib/analytics";
import type { OutfitBuilderProduct, OutfitSlot } from "@/lib/queries/outfit-builder";
import type { ShopCategory } from "@/lib/categories";
import { OUTFIT_SLOTS } from "@/lib/outfit-builder-config";
import { Button } from "@/components/ui/button";
import { AvatarTypeToggle } from "./avatar-type-toggle";
import { CategoryTabs } from "./category-tabs";
import { ProductStrip } from "./product-strip";
import { OutfitBuilderViewport } from "./outfit-builder-viewport";
import { OutfitLiveRegion } from "./outfit-live-region";
import { VariantPickerModal, type VariantPickerConfirmItem } from "./variant-picker-modal";

export interface OutfitBuilderDeepLink {
  avatarType: ShopCategory;
  items: Array<{ slot: OutfitSlot; product: OutfitBuilderProduct }>;
  editingOutfitName?: string | null;
}

function toOutfitItem(product: OutfitBuilderProduct): OutfitItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    modelUrl: product.modelUrl,
    category: product.category,
  };
}

export function OutfitBuilderPageClient({
  deepLink,
  isLoggedIn,
}: {
  deepLink: OutfitBuilderDeepLink | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const avatarType = useOutfitBuilderStore((s) => s.avatarType);
  const setAvatarType = useOutfitBuilderStore((s) => s.setAvatarType);
  const selections = useOutfitBuilderStore((s) => s.selections);
  const selectItem = useOutfitBuilderStore((s) => s.selectItem);
  const deselectItem = useOutfitBuilderStore((s) => s.deselectItem);
  const garmentLoad = useOutfitBuilderStore((s) => s.garmentLoad);
  const retryGarment = useOutfitBuilderStore((s) => s.retryGarment);
  const addItemToCart = useCartStore((s) => s.addItem);

  const [activeSlot, setActiveSlot] = useState<OutfitSlot>("top");
  const [editingOutfitName, setEditingOutfitName] = useState<string | null>(null);

  useEffect(() => {
    capture("outfit_builder_opened");
  }, []);

  // Deep-link prefill (PDP "Style This" button, or "Edit in Builder" from a
  // saved outfit) — applies once on mount only.
  const appliedDeepLink = useRef(false);
  useEffect(() => {
    (async () => {
      if (appliedDeepLink.current || !deepLink) return;
      appliedDeepLink.current = true;
      setAvatarType(deepLink.avatarType);
      for (const { slot, product } of deepLink.items) {
        selectItem(slot, toOutfitItem(product));
      }
      if (deepLink.editingOutfitName !== undefined) {
        setEditingOutfitName(deepLink.editingOutfitName);
      }
      const firstSlot = deepLink.items[0]?.slot;
      if (firstSlot) setActiveSlot(firstSlot);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink]);

  const { data: productsBySlot, isLoading } = useQuery({
    queryKey: ["outfit-builder-products", avatarType],
    queryFn: () => fetchOutfitBuilderProducts(avatarType),
    staleTime: 60_000,
  });

  function handleAvatarTypeChange(next: ShopCategory) {
    if (next === avatarType) return;
    const hadSelections = Object.keys(selections).length > 0;
    setAvatarType(next);
    if (hadSelections) {
      toast.info("Your selections were cleared for the new avatar type.");
    }
  }

  function handleSelectItem(slot: OutfitSlot, product: OutfitBuilderProduct) {
    selectItem(slot, toOutfitItem(product));
    capture("outfit_item_selected", { category: product.category, productId: product.id });
  }

  const selectedEntries = Object.entries(selections) as Array<[OutfitSlot, OutfitItem]>;

  // ---------------------------------------------------------------------
  // Add All to Cart (WF-005)
  // ---------------------------------------------------------------------
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartPending, setCartPending] = useState(false);

  function handleOpenCartModal() {
    if (selectedEntries.length === 0) {
      toast.error("Select at least one item first.");
      return;
    }
    setCartModalOpen(true);
  }

  async function handleConfirmAddToCart(selected: VariantPickerConfirmItem[]) {
    if (selected.length === 0) {
      toast.error("Choose a size for at least one item.");
      return;
    }
    setCartPending(true);
    const result = await validateOutfitVariants(selected);
    setCartPending(false);
    setCartModalOpen(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    const succeeded = result.items.filter((item) => item.ok);
    const failed = result.items.filter((item) => !item.ok);

    if (succeeded.length === 0) {
      toast.error("None of the selected items are available right now.");
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

    capture("outfit_added_to_cart", { avatarType, itemCount: succeeded.length });

    if (failed.length > 0) {
      toast.warning(
        `${failed
          .map((item) => `${item.productName ?? "An item"} — ${item.reason ?? "unavailable"}`)
          .join("; ")}. The rest were added to your cart.`,
        {
          action: { label: "View Cart", onClick: () => router.push("/cart") },
        }
      );
    } else {
      toast.success("Added to your cart.", {
        action: { label: "View Cart", onClick: () => router.push("/cart") },
        cancel: { label: "Keep Styling", onClick: () => {} },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Save Outfit (WF-004)
  // ---------------------------------------------------------------------
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savePending, setSavePending] = useState(false);

  function handleOpenSaveModal() {
    if (selectedEntries.length === 0) {
      toast.error("Select at least one item first.");
      return;
    }
    if (!isLoggedIn) {
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    setSaveModalOpen(true);
  }

  async function handleConfirmSave(selected: VariantPickerConfirmItem[], name: string) {
    if (selected.length === 0) {
      toast.error("Choose a size for at least one item.");
      return;
    }
    setSavePending(true);

    const thumbnailDataUrl = await captureCurrentThumbnailDataUrl();
    const thumbnailUrl = await uploadOutfitThumbnail(thumbnailDataUrl);

    const result = await saveOutfit({
      avatarType,
      name: name || editingOutfitName || undefined,
      items: selected,
      thumbnailUrl,
    });

    setSavePending(false);
    setSaveModalOpen(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    capture("outfit_saved", { avatarType, itemCount: selected.length });
    toast.success("Outfit saved.", {
      action: {
        label: "View Saved Outfits",
        onClick: () => router.push("/account/saved-outfits"),
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center">
        <AvatarTypeToggle value={avatarType} onChange={handleAvatarTypeChange} />
      </div>

      <div className="mx-auto w-full max-w-md">
        <OutfitBuilderViewport />
      </div>
      <OutfitLiveRegion />

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" onClick={handleOpenCartModal} className="sm:w-auto">
          Add All to Cart
        </Button>
        <Button type="button" variant="secondary" onClick={handleOpenSaveModal} className="sm:w-auto">
          Save Outfit
        </Button>
      </div>

      <div>
        <CategoryTabs activeSlot={activeSlot} onSelectSlot={setActiveSlot} />
        {OUTFIT_SLOTS.map((slot) => (
          <div key={slot.value} hidden={slot.value !== activeSlot}>
            <ProductStrip
              slot={slot.value}
              products={productsBySlot?.[slot.value] ?? []}
              isLoading={isLoading}
              selectedProductId={selections[slot.value]?.productId ?? null}
              garmentStatus={garmentLoad[slot.value]?.status}
              onSelect={(product) => handleSelectItem(slot.value, product)}
              onDeselect={() => deselectItem(slot.value)}
              onRetryGarment={() => retryGarment(slot.value)}
            />
          </div>
        ))}
      </div>

      <VariantPickerModal
        open={cartModalOpen}
        onClose={() => setCartModalOpen(false)}
        items={selectedEntries.map(([slot, item]) => ({ slot, item }))}
        mode="cart"
        pending={cartPending}
        onConfirm={handleConfirmAddToCart}
      />
      <VariantPickerModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        items={selectedEntries.map(([slot, item]) => ({ slot, item }))}
        mode="save"
        pending={savePending}
        initialName={editingOutfitName ?? undefined}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}

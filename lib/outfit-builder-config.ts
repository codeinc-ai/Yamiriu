import type { ShopCategory } from "@/lib/categories";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";

export const OUTFIT_SLOTS: ReadonlyArray<{ value: OutfitSlot; label: string }> = [
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "shoes", label: "Shoes" },
  { value: "accessory_jacket", label: "Accessory/Jacket" },
];

export function outfitSlotLabel(slot: OutfitSlot): string {
  return OUTFIT_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}

/** "Child" in the UI (WF-004 wording), backed by the same "kids" category
 * value used everywhere else in the schema/shop. */
export const AVATAR_TYPES: ReadonlyArray<{ value: ShopCategory; label: string }> = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "kids", label: "Child" },
];

export function avatarTypeLabel(type: ShopCategory): string {
  return AVATAR_TYPES.find((a) => a.value === type)?.label ?? type;
}

export const AVATAR_MODEL_URLS: Record<ShopCategory, string> = {
  men: "/models/avatars/men.glb",
  women: "/models/avatars/women.glb",
  kids: "/models/avatars/kids.glb",
};

"use client";

import { useOutfitBuilderStore, type OutfitItem } from "@/stores/outfit-builder";
import { OUTFIT_SLOTS, avatarTypeLabel } from "@/lib/outfit-builder-config";

/** Visually-hidden aria-live description of the current outfit for screen
 * reader users (PRD 10.6) — updates whenever a selection changes. */
export function OutfitLiveRegion() {
  const avatarType = useOutfitBuilderStore((s) => s.avatarType);
  const selections = useOutfitBuilderStore((s) => s.selections);

  const items = OUTFIT_SLOTS.map((slot) => selections[slot.value]).filter(
    (item): item is OutfitItem => Boolean(item)
  );

  const description =
    items.length === 0
      ? `${avatarTypeLabel(avatarType)} avatar, no items selected yet.`
      : `${avatarTypeLabel(avatarType)} avatar wearing: ${items.map((item) => item.name).join(", ")}.`;

  return (
    <p aria-live="polite" className="sr-only">
      {description}
    </p>
  );
}

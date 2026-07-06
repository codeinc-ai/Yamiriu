"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useOutfitBuilderStore } from "@/stores/outfit-builder";
import { getProductThumbnail } from "@/lib/product-images";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";
import { avatarTypeLabel } from "@/lib/outfit-builder-config";

// Layering order back-to-front, and each slot's box within the flat-lay
// composite — roughly mirrors where that garment sits on a body.
const LAYER_ORDER: OutfitSlot[] = ["bottom", "shoes", "top", "accessory_jacket"];

const LAYER_STYLE: Record<OutfitSlot, CSSProperties> = {
  top: { top: "5%", left: "20%", width: "60%", height: "36%" },
  bottom: { top: "36%", left: "26%", width: "48%", height: "36%" },
  shoes: { top: "70%", left: "30%", width: "40%", height: "22%" },
  accessory_jacket: { top: "3%", right: "3%", width: "26%", height: "26%" },
};

/**
 * Fully-functional non-3D outfit builder mode (PRD FR-009) — same
 * selection UI (category tabs/strips, shared Zustand store) as the 3D mode;
 * only the visualization differs, using each selected product's flat 2D
 * image layered into a flat-lay composite instead of a live 3D avatar.
 */
export function Viewport2DFallback() {
  const selections = useOutfitBuilderStore((s) => s.selections);
  const avatarType = useOutfitBuilderStore((s) => s.avatarType);
  const hasAnySelection = Object.keys(selections).length > 0;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
      <p className="absolute left-3 top-3 z-10 rounded-full bg-white/80 px-3 py-1 text-xs text-ink/70">
        2D preview mode
      </p>

      {!hasAnySelection ? (
        <div className="flex h-full items-center justify-center px-8 text-center text-sm text-ink/60">
          Select items below to build {avatarTypeLabel(avatarType).toLowerCase()}&apos;s outfit.
        </div>
      ) : (
        <div className="relative h-full w-full">
          {LAYER_ORDER.map((slot) => {
            const item = selections[slot];
            if (!item) return null;
            return (
              <div key={slot} className="absolute drop-shadow-md" style={LAYER_STYLE[slot]}>
                <Image
                  src={getProductThumbnail(item)}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes="50vw"
                  className="object-contain"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

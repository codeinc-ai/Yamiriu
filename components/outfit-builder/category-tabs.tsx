"use client";

import { useRef } from "react";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";
import { OUTFIT_SLOTS } from "@/lib/outfit-builder-config";
import { cn } from "@/lib/utils";

/** Keyboard-navigable ARIA tablist (WAI-ARIA Tabs pattern, PRD 10.6) — arrow
 * keys move focus and activate, Home/End jump to the first/last tab. */
export function CategoryTabs({
  activeSlot,
  onSelectSlot,
}: {
  activeSlot: OutfitSlot;
  onSelectSlot: (slot: OutfitSlot) => void;
}) {
  const tabRefs = useRef<Partial<Record<OutfitSlot, HTMLButtonElement | null>>>({});

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % OUTFIT_SLOTS.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + OUTFIT_SLOTS.length) % OUTFIT_SLOTS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = OUTFIT_SLOTS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = OUTFIT_SLOTS[nextIndex].value;
    onSelectSlot(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label="Outfit category" className="flex gap-1 border-b border-ink/10">
      {OUTFIT_SLOTS.map((slot, index) => {
        const selected = slot.value === activeSlot;
        return (
          <button
            key={slot.value}
            ref={(el) => {
              tabRefs.current[slot.value] = el;
            }}
            type="button"
            role="tab"
            id={`outfit-tab-${slot.value}`}
            aria-selected={selected}
            aria-controls={`outfit-tabpanel-${slot.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelectSlot(slot.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative min-h-[44px] px-4 py-2.5 text-sm font-medium transition-colors",
              selected ? "text-terracotta" : "text-ink/60 hover:text-ink"
            )}
          >
            {slot.label}
            {selected ? <span className="absolute inset-x-3 -bottom-px h-0.5 bg-terracotta" /> : null}
          </button>
        );
      })}
    </div>
  );
}

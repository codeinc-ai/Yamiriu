"use client";

import type { ShopCategory } from "@/lib/categories";
import { AVATAR_TYPES } from "@/lib/outfit-builder-config";
import { cn } from "@/lib/utils";

export function AvatarTypeToggle({
  value,
  onChange,
}: {
  value: ShopCategory;
  onChange: (type: ShopCategory) => void;
}) {
  return (
    <div role="group" aria-label="Avatar type" className="inline-flex rounded-full border border-ink/15 p-1">
      {AVATAR_TYPES.map((avatar) => {
        const selected = avatar.value === value;
        return (
          <button
            key={avatar.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(avatar.value)}
            className={cn(
              "min-w-[44px] rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selected ? "bg-ink text-cream" : "text-ink/70 hover:text-ink"
            )}
          >
            {avatar.label}
          </button>
        );
      })}
    </div>
  );
}

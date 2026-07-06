"use client";

import { useQueryStates } from "nuqs";
import { shopSearchParams } from "@/lib/shop-params";
import type { SortValue } from "@/lib/shop-types";

const OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "bestselling", label: "Bestselling" },
];

export function SortDropdown() {
  const [{ sort }, setParams] = useQueryStates(shopSearchParams, {
    shallow: false,
  });

  return (
    <label className="flex items-center gap-2 text-sm text-ink">
      <span className="sr-only">Sort by</span>
      <select
        value={sort}
        onChange={(e) =>
          setParams({ sort: e.target.value as SortValue, cursor: null })
        }
        className="h-11 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

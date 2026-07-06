"use client";

import { useState } from "react";
import { useQueryStates } from "nuqs";
import { shopSearchParams } from "@/lib/shop-params";
import { colorSwatchHex } from "@/lib/color-swatches";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import type { ProductFacets } from "@/lib/shop-types";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function FilterPanel({ facets }: { facets: ProductFacets }) {
  const [params, setParams] = useQueryStates(shopSearchParams, {
    shallow: false,
  });
  const [priceMinInput, setPriceMinInput] = useState(
    params.priceMin?.toString() ?? ""
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    params.priceMax?.toString() ?? ""
  );

  const debouncedSetPrice = useDebouncedCallback(
    (min: string, max: string) => {
      setParams({
        priceMin: min === "" ? null : Number(min),
        priceMax: max === "" ? null : Number(max),
        cursor: null,
      });
    },
    300
  );

  return (
    <div className="flex flex-col gap-8">
      {facets.sizes.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const checked = params.size.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={checked}
                  onClick={() =>
                    setParams({ size: toggle(params.size, size), cursor: null })
                  }
                  className={cn(
                    "min-w-[44px] rounded-md border px-3 py-2 text-sm transition-colors",
                    checked
                      ? "border-terracotta bg-terracotta/10 text-terracotta"
                      : "border-ink/20 text-ink hover:bg-ink/5"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.colors.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Color</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {facets.colors.map((color) => {
              const checked = params.color.includes(color);
              return (
                <button
                  key={color}
                  type="button"
                  aria-pressed={checked}
                  aria-label={color}
                  title={color}
                  onClick={() =>
                    setParams({ color: toggle(params.color, color), cursor: null })
                  }
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full border-2 transition-colors",
                    checked ? "border-terracotta" : "border-transparent"
                  )}
                >
                  <span
                    className="size-6 rounded-full border border-ink/15"
                    style={{ backgroundColor: colorSwatchHex(color) }}
                  />
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {facets.priceMax > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Price (PKR)</legend>
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              aria-label="Minimum price"
              placeholder={String(facets.priceMin)}
              value={priceMinInput}
              min={0}
              onChange={(e) => {
                setPriceMinInput(e.target.value);
                debouncedSetPrice(e.target.value, priceMaxInput);
              }}
              className="h-11 w-full min-w-0 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
            />
            <span className="text-ink/40">–</span>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Maximum price"
              placeholder={String(facets.priceMax)}
              value={priceMaxInput}
              min={0}
              onChange={(e) => {
                setPriceMaxInput(e.target.value);
                debouncedSetPrice(priceMinInput, e.target.value);
              }}
              className="h-11 w-full min-w-0 rounded-md border border-ink/20 bg-white px-3 text-sm text-ink outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
            />
          </div>
        </fieldset>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Availability</legend>
        <label className="mt-3 flex items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={params.availability === "in_stock"}
            onChange={(e) =>
              setParams({
                availability: e.target.checked ? "in_stock" : "all",
                cursor: null,
              })
            }
            className="size-5 rounded border-ink/30 text-terracotta focus:ring-terracotta/40"
          />
          In stock only
        </label>
      </fieldset>
    </div>
  );
}

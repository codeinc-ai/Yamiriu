import {
  parseAsArrayOf,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
  createSearchParamsCache,
  createLoader,
} from "nuqs/server";
import { SORT_VALUES, AVAILABILITY_VALUES } from "@/lib/shop-types";

/**
 * Single source of truth for /shop filter, sort, and pagination URL state
 * (PRD Rule 13 — all filters/sort/pagination via nuqs). Shared between the
 * Server Component page (via the cache) and the client filter/sort controls
 * (via useQueryStates), so parsing/defaults never drift between the two.
 */
export const shopSearchParams = {
  size: parseAsArrayOf(parseAsString).withDefault([]),
  color: parseAsArrayOf(parseAsString).withDefault([]),
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  availability: parseAsStringEnum([...AVAILABILITY_VALUES]).withDefault("all"),
  sort: parseAsStringEnum([...SORT_VALUES]).withDefault("newest"),
  cursor: parseAsString,
};

export const shopSearchParamsCache = createSearchParamsCache(shopSearchParams);
export const loadShopSearchParams = createLoader(shopSearchParams);

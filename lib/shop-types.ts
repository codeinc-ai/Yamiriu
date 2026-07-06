import type { ShopCategory } from "@/lib/categories";

export const SORT_VALUES = [
  "newest",
  "price_asc",
  "price_desc",
  "bestselling",
] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const AVAILABILITY_VALUES = ["all", "in_stock"] as const;
export type AvailabilityValue = (typeof AVAILABILITY_VALUES)[number];

export interface ProductListParams {
  category?: ShopCategory;
  sizes: string[];
  colors: string[];
  priceMin: number | null;
  priceMax: number | null;
  availability: AvailabilityValue;
  sort: SortValue;
  cursor: string | null;
  limit?: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
  salesCount: number;
  createdAt: Date;
}

export interface ProductListResult {
  items: ProductListItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ProductFacets {
  sizes: string[];
  colors: string[];
  priceMin: number;
  priceMax: number;
}

import type { Product } from "@/db/schema";

export type ShopCategory = Product["category"];

export const SHOP_CATEGORIES: ReadonlyArray<{
  value: ShopCategory;
  label: string;
  href: string;
}> = [
  { value: "men", label: "Men", href: "/shop/men" },
  { value: "women", label: "Women", href: "/shop/women" },
  { value: "kids", label: "Kids", href: "/shop/kids" },
];

export function isShopCategory(value: string): value is ShopCategory {
  return SHOP_CATEGORIES.some((c) => c.value === value);
}

export function categoryLabel(value: ShopCategory): string {
  return SHOP_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

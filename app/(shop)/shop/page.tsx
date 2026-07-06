import type { Metadata } from "next";
import { shopSearchParamsCache } from "@/lib/shop-params";
import { ShopView } from "@/components/shop/shop-view";

export const metadata: Metadata = {
  title: "Shop All",
  description:
    "Shop the full Yamiriu catalogue — Italian-inspired clothing for men, women, and kids in Pakistan.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = shopSearchParamsCache.parse(await searchParams);

  return (
    <ShopView
      title="Shop All"
      basePath="/shop"
      params={{
        size: params.size,
        color: params.color,
        priceMin: params.priceMin,
        priceMax: params.priceMax,
        availability: params.availability,
        sort: params.sort,
        cursor: params.cursor,
      }}
    />
  );
}

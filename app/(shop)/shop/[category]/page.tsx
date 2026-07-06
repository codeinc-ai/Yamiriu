import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopSearchParamsCache } from "@/lib/shop-params";
import { ShopView } from "@/components/shop/shop-view";
import { SHOP_CATEGORIES, isShopCategory, categoryLabel } from "@/lib/categories";

export function generateStaticParams() {
  return SHOP_CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isShopCategory(category)) return {};

  const label = categoryLabel(category);
  const title = `${label}'s Collection`;
  const description = `Shop Yamiriu's ${label} collection — Italian-inspired clothing for Pakistan.`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${category}` },
    openGraph: {
      title,
      description,
      url: `/shop/${category}`,
      images: [{ url: `/api/og?title=${encodeURIComponent(title)}` }],
    },
  };
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category } = await params;
  if (!isShopCategory(category)) notFound();

  const parsed = shopSearchParamsCache.parse(await searchParams);

  return (
    <ShopView
      title={`${categoryLabel(category)}'s Collection`}
      category={category}
      basePath={`/shop/${category}`}
      params={{
        size: parsed.size,
        color: parsed.color,
        priceMin: parsed.priceMin,
        priceMax: parsed.priceMax,
        availability: parsed.availability,
        sort: parsed.sort,
        cursor: parsed.cursor,
      }}
    />
  );
}

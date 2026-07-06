import { getProductList, getProductFacets } from "@/lib/queries/products";
import { getWishlistProductIds } from "@/actions/wishlist";
import { getCurrentUser } from "@/lib/auth-guards";
import type { ShopCategory } from "@/lib/categories";
import type {
  AvailabilityValue,
  SortValue,
} from "@/lib/shop-types";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "./breadcrumbs";
import { FilterSidebar } from "./filter-sidebar";
import { SortDropdown } from "./sort-dropdown";
import { ProductGrid } from "./product-grid";
import { EmptyState } from "./empty-state";
import { PaginationLoadMore } from "./pagination-load-more";
import { WishlistHydrator } from "./wishlist-hydrator";

export interface ShopViewParams {
  size: string[];
  color: string[];
  priceMin: number | null;
  priceMax: number | null;
  availability: AvailabilityValue;
  sort: SortValue;
  cursor: string | null;
}

export async function ShopView({
  title,
  category,
  basePath,
  params,
}: {
  title: string;
  category?: ShopCategory;
  basePath: string;
  params: ShopViewParams;
}) {
  const [{ items, hasMore, nextCursor }, facets, user] = await Promise.all([
    getProductList({
      category,
      sizes: params.size,
      colors: params.color,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      availability: params.availability,
      sort: params.sort,
      cursor: params.cursor,
    }),
    getProductFacets(category),
    getCurrentUser(),
  ]);

  const wishlistIds = await getWishlistProductIds();
  const isAuthenticated = Boolean(user);
  const hasActiveFilters =
    params.size.length > 0 ||
    params.color.length > 0 ||
    params.priceMin != null ||
    params.priceMax != null ||
    params.availability === "in_stock";

  const breadcrumbItems = category
    ? [{ label: "Home", href: "/" }, { label: "Shop", href: "/shop" }, { label: title }]
    : [{ label: "Home", href: "/" }, { label: title }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <WishlistHydrator ids={wishlistIds} />
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, basePath)} />
      <Breadcrumbs items={breadcrumbItems} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{title}</h1>
        <SortDropdown />
      </div>

      <div className="mt-10 flex flex-col gap-8 md:flex-row md:gap-10">
        <FilterSidebar facets={facets} />

        <div className="flex-1">
          {items.length === 0 ? (
            <EmptyState resetHref={hasActiveFilters ? basePath : "/shop"} />
          ) : (
            <>
              <ProductGrid products={items} isAuthenticated={isAuthenticated} />
              {hasMore && nextCursor ? (
                <PaginationLoadMore nextCursor={nextCursor} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

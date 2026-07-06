import Link from "next/link";
import { TrackedButtonLink } from "@/components/ui/tracked-button-link";
import { Placeholder } from "@/components/ui/placeholder";
import { ProductGrid } from "@/components/shop/product-grid";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { getProductList } from "@/lib/queries/products";
import { getWishlistProductIds } from "@/actions/wishlist";
import { getCurrentUser } from "@/lib/auth-guards";
import { WishlistHydrator } from "@/components/shop/wishlist-hydrator";
import type { AudienceConfig } from "@/lib/audience-config";

export async function AudienceLanding({ config }: { config: AudienceConfig }) {
  const [{ items: highlights }, user, wishlistIds] = await Promise.all([
    getProductList({
      category: config.category,
      sizes: [],
      colors: [],
      priceMin: null,
      priceMax: null,
      availability: "all",
      sort: "bestselling",
      cursor: null,
      limit: 8,
    }),
    getCurrentUser(),
    getWishlistProductIds(),
  ]);

  const breadcrumbItems = [{ label: "Home", href: "/" }, { label: config.navLabel }];

  return (
    <div>
      <WishlistHydrator ids={wishlistIds} />
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, `/for-${config.category}`)} />

      <section className="relative isolate flex min-h-[60vh] items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Placeholder ratio="16/9" palette={config.palette} rounded={false} priority sizes="100vw" className="h-full" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/30 to-ink/10" />

        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="max-w-2xl text-cream">
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">{config.heading}</h1>
            <p className="mt-5 max-w-lg text-lg text-cream/90">{config.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedButtonLink ctaLabel={`audience_${config.category}_shop`} href={`/shop/${config.category}`} size="lg">
                Shop {config.navLabel}
              </TrackedButtonLink>
              <TrackedButtonLink
                ctaLabel={`audience_${config.category}_build_outfit`}
                href={`/outfit-builder?avatarType=${config.category}`}
                variant="secondary"
                size="lg"
                className="border-cream/40 bg-transparent text-cream hover:bg-cream/10"
              >
                Build a {config.navLabel} Outfit
              </TrackedButtonLink>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-ink sm:text-3xl">Highlights</h2>
          <Link href={`/shop/${config.category}`} className="shrink-0 text-sm text-terracotta hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="mt-8">
          {highlights.length === 0 ? (
            <p className="text-sm text-ink/60">New arrivals are on the way — check back soon.</p>
          ) : (
            <ProductGrid products={highlights} isAuthenticated={Boolean(user)} />
          )}
        </div>
      </div>
    </div>
  );
}

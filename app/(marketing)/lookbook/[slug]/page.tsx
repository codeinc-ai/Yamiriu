import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ScrollDepthTracker } from "@/components/providers/scroll-depth-tracker";
import { TrackedButtonLink } from "@/components/ui/tracked-button-link";
import { ProductGrid } from "@/components/shop/product-grid";
import { WishlistHydrator } from "@/components/shop/wishlist-hydrator";
import { getWishlistProductIds } from "@/actions/wishlist";
import { getCurrentUser } from "@/lib/auth-guards";
import { getLookbookEntryBySlug, getAllPublishedLookbookSlugs } from "@/lib/queries/lookbook";
import { LookbookScrollHero } from "@/components/marketing/lookbook/lookbook-scroll-hero";
import { GsapReveal } from "@/components/marketing/lookbook/gsap-reveal";

export async function generateStaticParams() {
  const slugs = await getAllPublishedLookbookSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getLookbookEntryBySlug(slug);
  if (!entry) return {};

  const description = entry.description ?? `${entry.title} — a Yamiriu editorial look, shoppable in full.`;
  return {
    title: entry.title,
    description,
    alternates: { canonical: `/lookbook/${entry.slug}` },
    openGraph: {
      title: entry.title,
      description,
      url: `/lookbook/${entry.slug}`,
      images: [{ url: entry.imageUrl }],
    },
  };
}

export default async function LookbookEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getLookbookEntryBySlug(slug);
  if (!entry) notFound();

  const [user, wishlistIds] = await Promise.all([getCurrentUser(), getWishlistProductIds()]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Lookbook", href: "/lookbook" },
    { label: entry.title },
  ];

  const recreateHref =
    entry.products.length > 0 ? `/outfit-builder?items=${entry.products.map((p) => p.id).join(",")}` : null;

  return (
    <div>
      <ScrollDepthTracker />
      <WishlistHydrator ids={wishlistIds} />
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, `/lookbook/${entry.slug}`)} />

      <LookbookScrollHero imageUrl={entry.imageUrl} title={entry.title} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <Breadcrumbs items={breadcrumbItems} />

        {entry.description ? (
          <GsapReveal className="mt-6 max-w-2xl">
            <p className="text-lg leading-relaxed text-ink/80">{entry.description}</p>
          </GsapReveal>
        ) : null}

        {recreateHref ? (
          <GsapReveal className="mt-6">
            <TrackedButtonLink ctaLabel="lookbook_recreate_in_outfit_builder" href={recreateHref} size="lg">
              Recreate in Outfit Builder
            </TrackedButtonLink>
          </GsapReveal>
        ) : null}

        {entry.products.length > 0 ? (
          <GsapReveal className="mt-14">
            <h2 className="font-display text-2xl text-ink sm:text-3xl">Shop the Look</h2>
            <div className="mt-8">
              <ProductGrid products={entry.products} isAuthenticated={Boolean(user)} />
            </div>
          </GsapReveal>
        ) : null}
      </div>
    </div>
  );
}

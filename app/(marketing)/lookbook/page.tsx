import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ScrollDepthTracker } from "@/components/providers/scroll-depth-tracker";
import { getPublishedLookbookEntries } from "@/lib/queries/lookbook";

export const metadata: Metadata = {
  title: "Lookbook",
  description:
    "Explore Yamiriu's editorial lookbook — curated outfits styled together, with every piece shoppable and recreatable in the 3D Outfit Builder.",
  alternates: { canonical: "/lookbook" },
  openGraph: {
    title: "Lookbook | Yamiriu",
    description: "Curated outfits, styled together — shop the look or recreate it in 3D.",
    url: "/lookbook",
    images: [{ url: "/api/og?title=Lookbook&description=Curated%20outfits%2C%20styled%20together" }],
  },
};

const breadcrumbItems = [{ label: "Home", href: "/" }, { label: "Lookbook" }];

export default async function LookbookIndexPage() {
  const entries = await getPublishedLookbookEntries();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <ScrollDepthTracker />
      <JsonLd data={breadcrumbListJsonLd(breadcrumbItems, "/lookbook")} />
      <Breadcrumbs items={breadcrumbItems} />

      <h1 className="mt-4 font-display text-4xl text-ink sm:text-5xl">Lookbook</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        Outfits styled together by our team — every piece is shoppable, and you can recreate the
        whole look in the 3D Outfit Builder.
      </p>

      {entries.length === 0 ? (
        <p className="mt-12 text-sm text-ink/60">New editorial stories are on the way — check back soon.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/lookbook/${entry.slug}`}
              className="group relative block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-ink/5">
                <Image
                  src={entry.imageUrl}
                  alt={entry.title}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 31vw, 46vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <span className="absolute bottom-4 left-4 font-display text-lg text-cream">{entry.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

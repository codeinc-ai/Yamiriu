import Image from "next/image";
import { TrackedButtonLink } from "@/components/ui/tracked-button-link";
import { makePlaceholder } from "@/components/ui/placeholder";
import { getPrimaryActiveBanner } from "@/lib/queries/banners";

export async function Hero() {
  const banner = await getPrimaryActiveBanner();
  const heroImage = banner?.imageUrl ?? makePlaceholder("olive", "", "16/9");
  const primaryHref = banner?.linkUrl || "/shop";

  return (
    <section className="relative isolate flex min-h-[82vh] items-center overflow-hidden">
      {/* Full-bleed editorial background (LCP image, no CLS — it's a background). */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={heroImage}
          alt={banner?.title || "Editorial campaign imagery"}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/30 to-ink/10" />

      <div className="mx-auto w-full max-w-7xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl text-cream">
          <p className="text-sm uppercase tracking-[0.25em] text-cream/80">
            New Season
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
            {banner?.title || "The Italian clothing brand for Pakistan"}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-cream/90">
            Editorial tailoring and everyday elegance — build and visualize full
            outfits on a 3D avatar before you buy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedButtonLink ctaLabel="hero_shop_new_arrivals" href={primaryHref} size="lg">
              Shop New Arrivals
            </TrackedButtonLink>
            <TrackedButtonLink
              ctaLabel="hero_build_your_outfit"
              href="/outfit-builder"
              variant="secondary"
              size="lg"
              className="border-cream/40 bg-transparent text-cream hover:bg-cream/10"
            >
              Build Your Outfit
            </TrackedButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

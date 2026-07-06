import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationJsonLd } from "@/lib/structured-data";
import { ScrollDepthTracker } from "@/components/providers/scroll-depth-tracker";
import { Hero } from "@/components/marketing/home/hero";
import { CategoryGrid } from "@/components/marketing/home/category-grid";
import { OutfitBuilderTeaser } from "@/components/marketing/home/outfit-builder-teaser";
import { Bestsellers } from "@/components/marketing/home/bestsellers";
import { LookbookPreview } from "@/components/marketing/home/lookbook-preview";
import { BrandStory } from "@/components/marketing/home/brand-story";
import { NewsletterSection } from "@/components/marketing/home/newsletter-section";

export const metadata: Metadata = {
  title: { absolute: "Yamiriu — Italian Clothing Brand in Pakistan" },
  description:
    "Yamiriu is an Italian-inspired clothing brand for Pakistan. Build and visualize full outfits on a 3D avatar before you buy. Shop men's, women's & kids'.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Yamiriu — Italian Clothing Brand in Pakistan",
    description:
      "Italian-inspired clothing for Pakistan. Build full outfits on a 3D avatar before you buy.",
    url: "/",
    images: [{ url: "/api/og?title=Yamiriu&description=Italian-inspired%20clothing%20for%20Pakistan" }],
  },
};

export default function HomePage() {
  return (
    <>
      <ScrollDepthTracker />
      <JsonLd data={organizationJsonLd()} />
      <Hero />
      <CategoryGrid />
      <OutfitBuilderTeaser />
      <Bestsellers />
      <LookbookPreview />
      <BrandStory />
      <NewsletterSection />
    </>
  );
}

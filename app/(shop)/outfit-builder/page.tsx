import type { Metadata } from "next";
import { getOutfitBuilderProductById, getOutfitBuilderProductsByIds } from "@/lib/queries/outfit-builder";
import { getSavedOutfitForEdit } from "@/lib/queries/saved-outfits";
import { getCurrentUser } from "@/lib/auth-guards";
import { isShopCategory } from "@/lib/categories";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import {
  OutfitBuilderPageClient,
  type OutfitBuilderDeepLink,
} from "@/components/outfit-builder/outfit-builder-page-client";

const TITLE = "Custom Outfit Builder";
const DESCRIPTION =
  "Try our custom outfit builder — mix tops, bottoms, shoes, and accessories in 3D on a Men's, Women's, or Kids' avatar, then save or shop the look.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/outfit-builder" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/outfit-builder",
    type: "website",
  },
};

export default async function OutfitBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; items?: string; outfit?: string; avatarType?: string }>;
}) {
  const { item, items, outfit, avatarType } = await searchParams;
  const user = await getCurrentUser();

  let deepLink: OutfitBuilderDeepLink | null = null;

  if (outfit && user) {
    // "Edit in Builder" from /account/saved-outfits — ownership-checked.
    const resolved = await getSavedOutfitForEdit(outfit, user.id);
    if (resolved && resolved.items.length > 0) {
      deepLink = {
        avatarType: resolved.avatarType,
        items: resolved.items.map(({ slot, product }) => ({ slot, product })),
        editingOutfitName: resolved.name,
      };
    }
  } else if (items) {
    // Lookbook "Recreate in Outfit Builder" CTA — multiple products at once.
    const resolved = await getOutfitBuilderProductsByIds(items.split(",").filter(Boolean));
    if (resolved.length > 0) {
      deepLink = {
        avatarType: resolved[0].product.category,
        items: resolved,
      };
    }
  } else if (item) {
    // PDP "Style This" button.
    const resolved = await getOutfitBuilderProductById(item);
    if (resolved) {
      deepLink = {
        avatarType: resolved.product.category,
        items: [{ slot: resolved.slot, product: resolved.product }],
      };
    }
  } else if (avatarType && isShopCategory(avatarType)) {
    // Audience landing page CTA — pre-set the avatar only, no items.
    deepLink = { avatarType, items: [] };
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <JsonLd data={breadcrumbListJsonLd([{ label: "Home", href: "/" }, { label: "Outfit Builder" }], "/outfit-builder")} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Outfit Builder" }]} />
      <h1 className="mt-4 text-center font-display text-3xl text-ink sm:text-4xl">Outfit Builder</h1>
      <p className="mt-2 text-center text-ink/70">
        Mix tops, bottoms, shoes &amp; accessories — see it come together in 3D.
      </p>
      <div className="mt-8">
        <OutfitBuilderPageClient deepLink={deepLink} isLoggedIn={Boolean(user)} />
      </div>
    </div>
  );
}

import { makePlaceholder } from "@/components/ui/placeholder";
import type { ShopCategory } from "@/lib/categories";

/**
 * No real product photography exists yet (UploadThing / admin image upload is
 * a later phase). This module deterministically derives a small gallery of
 * brand-tinted placeholder images from stable product attributes, so every
 * render (SSR, hover-swap, gallery) shows the same images without storing
 * anything extra in the DB. Swap for real `product.images` URLs once uploads
 * exist — call sites only depend on this module, not the DB shape.
 */
const CATEGORY_PALETTE = {
  men: "ink",
  women: "terracotta",
  kids: "gold",
} as const;

const GALLERY_LABELS = ["Front", "Back", "Detail"] as const;

const REVIEW_PALETTES = ["cream", "olive", "terracotta", "ink", "gold"] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export interface ProductImageSource {
  slug: string;
  name: string;
  category: ShopCategory;
  /** Admin-uploaded gallery (UploadThing), when it exists — takes priority
   * over the generated placeholder (PRD 4.8.3). */
  images?: string[] | null;
}

/** A small, stable gallery (front/back/detail) for a product's PDP + cards.
 * Falls back to placeholders only until an admin uploads real photography. */
export function getProductImages(
  product: ProductImageSource,
  count = 3
): string[] {
  if (product.images?.length) return product.images;

  const palette = CATEGORY_PALETTE[product.category] ?? "cream";
  return Array.from({ length: count }, (_, i) =>
    makePlaceholder(palette, GALLERY_LABELS[i % GALLERY_LABELS.length], "4/3")
  );
}

/** The primary (first) gallery image — used for grid cards. */
export function getProductThumbnail(product: ProductImageSource): string {
  return getProductImages(product, 1)[0];
}

/** The secondary gallery image — used for the grid hover-swap. */
export function getProductHoverImage(product: ProductImageSource): string {
  return getProductImages(product, 2)[1];
}

/** Deterministic placeholder for a review photo token (e.g. "review-photo:x:1"). */
export function getReviewPhotoUrl(token: string): string {
  const palette = REVIEW_PALETTES[hashSeed(token) % REVIEW_PALETTES.length];
  return makePlaceholder(palette, undefined, "1/1");
}

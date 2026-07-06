import type { ShopCategory } from "@/lib/categories";

/** Copy + keyword-targeted metadata for the /for-men, /for-women, /for-kids
 * landing pages (PRD 9.3) — these are the primary nav destinations (see
 * NAV_CATEGORIES in lib/site-config.ts), not just supplementary SEO pages. */
export interface AudienceConfig {
  category: ShopCategory;
  navLabel: string;
  heading: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  palette: "ink" | "terracotta" | "gold" | "olive" | "cream";
}

export const AUDIENCE_CONFIG: Record<ShopCategory, AudienceConfig> = {
  men: {
    category: "men",
    navLabel: "Men",
    heading: "Men's Clothing, Italian-Inspired",
    tagline:
      "Tailored shirts, trousers, and jackets built for how Pakistan actually dresses — considered fabrics, honest prices.",
    metaTitle: "Men's Clothing in Pakistan — Italian-Inspired Tailoring",
    metaDescription:
      "Shop Yamiriu's men's collection: shirts, trousers, jackets & shoes with Italian-inspired tailoring. Build your outfit on a 3D avatar before you buy.",
    palette: "ink",
  },
  women: {
    category: "women",
    navLabel: "Women",
    heading: "Women's Clothing, Editorial Elegance",
    tagline:
      "Blouses, skirts, and everyday pieces with a considered, editorial hand — made for Pakistan's climate and pace.",
    metaTitle: "Women's Clothing in Pakistan — Editorial Everyday Wear",
    metaDescription:
      "Shop Yamiriu's women's collection: blouses, skirts & tailored pieces. Build your outfit on a 3D avatar before you buy — Italian-inspired, Pakistan-made.",
    palette: "terracotta",
  },
  kids: {
    category: "kids",
    navLabel: "Kids",
    heading: "Kids' Clothing, Made to Play",
    tagline:
      "Durable, comfortable everyday wear for kids — sized and styled without compromising on quality.",
    metaTitle: "Kids' Clothing in Pakistan — Durable Everyday Wear",
    metaDescription:
      "Shop Yamiriu's kids' collection: tees, shorts & cardigans built to last. Preview outfits on a 3D avatar before you buy.",
    palette: "gold",
  },
};

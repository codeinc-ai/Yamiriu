import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import { SOCIAL_LINKS } from "@/lib/site-config";
import type { BreadcrumbItem } from "@/components/shop/breadcrumbs";

/** WebSite schema — root layout (BLOCK 05). */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en-PK",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Organization schema — homepage (BLOCK 05). */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    description: SITE_DESCRIPTION,
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };
}

/** BreadcrumbList schema — every inner page (BLOCK 05). Items without an
 * `href` (the current page) are still listed, using the current page URL. */
export function breadcrumbListJsonLd(
  items: BreadcrumbItem[],
  currentUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${SITE_URL}${item.href}` : `${SITE_URL}${currentUrl}`,
    })),
  };
}

/** FAQPage schema — /faq (BLOCK 05). */
export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface ArticleJsonLdInput {
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
}

/** Article schema — /journal/[slug] (BLOCK 05). */
export function articleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.imageUrl ? [input.imageUrl] : undefined,
    url: `${SITE_URL}${input.url}`,
    datePublished: input.publishedAt ?? undefined,
    author: input.authorName ? { "@type": "Person", name: input.authorName } : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` } },
  };
}

export interface ProductJsonLdInput {
  name: string;
  description: string | null;
  url: string;
  images: string[];
  price: string;
  inStock: boolean;
  rating?: { average: number; count: number };
}

/** Product schema — PDPs (BLOCK 05): price, availability, aggregate rating. */
export function productJsonLd(input: ProductJsonLdInput): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.images,
    url: `${SITE_URL}${input.url}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: input.price,
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}${input.url}`,
    },
  };

  if (input.rating && input.rating.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(input.rating.average.toFixed(1)),
      reviewCount: input.rating.count,
    };
  }

  return data;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getProductReviews,
  getAllPublishedSlugs,
} from "@/lib/queries/products";
import { getWishlistProductIds } from "@/actions/wishlist";
import { getReviewEligibility } from "@/actions/reviews";
import { getCurrentUser } from "@/lib/auth-guards";
import { categoryLabel } from "@/lib/categories";
import { formatPkr } from "@/lib/format";
import { getProductImages } from "@/lib/product-images";
import { JsonLd } from "@/components/seo/json-ld";
import { productJsonLd, breadcrumbListJsonLd } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { ProductViewTracker } from "@/components/shop/product-view-tracker";
import { ImageGallery } from "@/components/shop/image-gallery";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { SizeGuideModal } from "@/components/shop/size-guide-modal";
import { OutfitBuilderCta } from "@/components/shop/outfit-builder-cta";
import { ReviewsSection } from "@/components/shop/reviews-section";
import { ReviewSubmissionForm } from "@/components/shop/review-submission-form";
import { RelatedProducts } from "@/components/shop/related-products";
import { WishlistHydrator } from "@/components/shop/wishlist-hydrator";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) return {};

  const { product } = result;
  const description =
    product.description ?? `Shop the ${product.name} from Yamiriu.`;
  const images = getProductImages(product);

  return {
    title: product.name,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/product/${product.slug}`,
      images: [{ url: images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) notFound();

  const { product, variants } = result;

  const [related, reviewData, user, wishlistIds] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductReviews(product.id),
    getCurrentUser(),
    getWishlistProductIds(),
  ]);

  const reviewEligibility = user ? await getReviewEligibility(product.id) : null;

  const images = getProductImages(product);
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const categoryHref = `/shop/${product.category}`;

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: categoryLabel(product.category), href: categoryHref },
    { label: product.name },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <ProductViewTracker productId={product.id} category={product.category} />
      <WishlistHydrator ids={wishlistIds} />
      <JsonLd
        data={productJsonLd({
          name: product.name,
          description: product.description,
          url: `/product/${product.slug}`,
          images,
          price: product.price,
          inStock: totalStock > 0,
          rating:
            reviewData.count > 0
              ? { average: reviewData.average, count: reviewData.count }
              : undefined,
        })}
      />
      <JsonLd
        data={breadcrumbListJsonLd(breadcrumbItems, `/product/${product.slug}`)}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ImageGallery images={images} alt={product.name} />

        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-xl text-ink/80">{formatPkr(product.price)}</p>
          {product.description ? (
            // Sanitized at write time (actions/admin/products.ts, small
            // safe allowlist) — safe to render as-is (S-011).
            <div
              className="mt-4 text-sm leading-relaxed text-ink/70 [&_a]:text-terracotta [&_a]:underline [&_li]:ml-4 [&_ul]:list-disc [&_ol]:list-decimal"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : null}

          <div className="mt-8">
            <ProductPurchasePanel
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              productCategory={product.category}
              price={product.price}
              variants={variants}
            />
          </div>

          <div className="mt-4">
            <SizeGuideModal />
          </div>

          {product.hasModel ? (
            <div className="mt-4">
              <OutfitBuilderCta productId={product.id} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-16 flex flex-col gap-16">
        <div className="flex flex-col gap-8">
          {reviewEligibility?.eligible && !reviewEligibility.alreadyReviewed ? (
            <ReviewSubmissionForm productId={product.id} />
          ) : null}
          <ReviewsSection
            reviews={reviewData.reviews}
            average={reviewData.average}
            count={reviewData.count}
          />
        </div>
        <RelatedProducts products={related} isAuthenticated={Boolean(user)} />
      </div>
    </div>
  );
}

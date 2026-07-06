import { ProductGrid } from "./product-grid";
import type { ProductCardData } from "./product-card";

export function RelatedProducts({
  products,
  isAuthenticated,
}: {
  products: ProductCardData[];
  isAuthenticated: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="border-t border-ink/10 pt-12">
      <h2 id="related-heading" className="font-display text-2xl text-ink">
        You Might Also Like
      </h2>
      <div className="mt-6">
        <ProductGrid products={products} isAuthenticated={isAuthenticated} />
      </div>
    </section>
  );
}

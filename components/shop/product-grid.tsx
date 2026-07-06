import { ProductCard, type ProductCardData } from "./product-card";

// 2-col mobile, 3-col tablet, 4-col desktop (PRD 10.3).
export function ProductGrid({
  products,
  isAuthenticated,
}: {
  products: ProductCardData[];
  isAuthenticated: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { formatPkr } from "@/lib/format";
import { getProductThumbnail, getProductHoverImage } from "@/lib/product-images";
import type { ShopCategory } from "@/lib/categories";
import { WishlistButton } from "./wishlist-button";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  price: string;
  category: ShopCategory;
}

export function ProductCard({
  product,
  isAuthenticated,
}: {
  product: ProductCardData;
  isAuthenticated: boolean;
}) {
  const front = getProductThumbnail(product);
  const back = getProductHoverImage(product);

  return (
    <div className="group relative">
      <Link href={`/product/${product.slug}`} className="block">
        <div
          className="relative overflow-hidden rounded-xl bg-ink/5"
          style={{ aspectRatio: "3 / 4" }}
        >
          <Image
            src={front}
            alt={product.name}
            fill
            unoptimized
            sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw"
            className="object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
          <Image
            src={back}
            alt=""
            aria-hidden="true"
            fill
            unoptimized
            sizes="(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 46vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        </div>
        <h3 className="mt-3 text-sm font-medium text-ink">{product.name}</h3>
        <p className="mt-0.5 text-sm text-ink/70">{formatPkr(product.price)}</p>
      </Link>
      <WishlistButton
        productId={product.id}
        isAuthenticated={isAuthenticated}
        className="absolute right-2 top-2"
      />
    </div>
  );
}

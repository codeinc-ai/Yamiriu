import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth-guards";
import { getWishlistProducts } from "@/lib/queries/wishlist";
import { WishlistGrid } from "@/components/account/wishlist-grid";

export const metadata: Metadata = {
  title: "Your Wishlist",
  robots: { index: false, follow: false },
};

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const products = await getWishlistProducts(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl text-ink">Your Wishlist</h1>
      <WishlistGrid products={products} />
    </div>
  );
}

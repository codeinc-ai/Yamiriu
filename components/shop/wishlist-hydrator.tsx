"use client";

import { useEffect } from "react";
import { useWishlistStore } from "@/stores/wishlist";

/** Seeds the client wishlist store once from the server-fetched id list. */
export function WishlistHydrator({ ids }: { ids: string[] }) {
  const hydrate = useWishlistStore((state) => state.hydrate);
  useEffect(() => {
    hydrate(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate identity is stable
  }, [ids]);
  return null;
}

"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useWishlistStore, selectIsWishlisted } from "@/stores/wishlist";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlist";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  isAuthenticated,
  className,
}: {
  productId: string;
  isAuthenticated: boolean;
  className?: string;
}) {
  const hydrated = useHydrated();
  const wishlisted = useWishlistStore(selectIsWishlisted(productId));
  const add = useWishlistStore((s) => s.add);
  const remove = useWishlistStore((s) => s.remove);
  const [pending, startTransition] = useTransition();
  const [optimisticError, setOptimisticError] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const active = hydrated && wishlisted && !optimisticError;

  function handleClick() {
    if (!isAuthenticated) {
      toast.error("Sign in to save items to your wishlist.");
      router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    setOptimisticError(false);
    const wasActive = wishlisted;

    // Optimistic update (PRD FR-003, 10.7), rolled back on failure.
    if (wasActive) {
      remove(productId);
    } else {
      add(productId);
    }

    startTransition(async () => {
      const result = wasActive
        ? await removeFromWishlist({ productId })
        : await addToWishlist({ productId });

      if (!result.ok) {
        if (wasActive) add(productId);
        else remove(productId);
        setOptimisticError(true);
        toast.error(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta disabled:cursor-wait",
        className
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        className={active ? "text-terracotta" : "text-ink"}
        aria-hidden="true"
      >
        <path
          d="M12 21s-7.5-4.6-10-9.1C.5 8.4 2.3 5 5.7 5c2 0 3.4 1 4.3 2.4C11 6 12.4 5 14.3 5 17.7 5 19.5 8.4 22 11.9 19.5 16.4 12 21 12 21Z"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

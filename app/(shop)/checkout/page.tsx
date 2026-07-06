import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth-guards";
import { getUserAddresses } from "@/lib/queries/addresses";

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Yamiriu order.",
  alternates: { canonical: "/checkout" },
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const savedAddresses = user ? await getUserAddresses(user.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">Checkout</h1>
      <div className="mt-8">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutPageClient isLoggedIn={Boolean(user)} savedAddresses={savedAddresses} />
        </Suspense>
      </div>
    </div>
  );
}

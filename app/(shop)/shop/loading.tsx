import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="mt-10 flex flex-col gap-8 md:flex-row md:gap-10">
        <div className="hidden w-64 shrink-0 md:block">
          <Skeleton className="h-6 w-20" />
          <div className="mt-4 flex flex-col gap-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="flex-1">
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}

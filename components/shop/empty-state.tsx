import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({ resetHref }: { resetHref: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ink/30"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
      <h2 className="font-display text-xl text-ink">
        No products match your filters
      </h2>
      <p className="max-w-sm text-sm text-ink/70">
        Try widening your price range or clearing a filter to see more results.
      </p>
      <Link href={resetHref}>
        <Button variant="secondary">Reset filters</Button>
      </Link>
    </div>
  );
}

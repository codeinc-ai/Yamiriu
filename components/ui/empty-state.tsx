import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "./button";

/** Generic icon + headline + CTA empty state (PRD 10.4), shared across
 * account/admin lists. components/shop/empty-state.tsx stays separate since
 * it's tuned specifically to the filter-reset flow. */
export function EmptyState({
  icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-ink/15 py-16 text-center">
      <span className="text-ink/30" aria-hidden="true">
        {icon}
      </span>
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-ink/70">{description}</p> : null}
      <Link href={ctaHref}>
        <Button variant="secondary">{ctaLabel}</Button>
      </Link>
    </div>
  );
}

"use client";

import type { ComponentProps } from "react";
import { capture } from "@/lib/analytics";
import { ButtonLink } from "./button-link";

/** A ButtonLink that fires `cta_click` on click (BLOCK 10) — for use in
 * server components that can't attach onClick handlers directly. */
export function TrackedButtonLink({
  ctaLabel,
  onClick,
  ...props
}: ComponentProps<typeof ButtonLink> & { ctaLabel: string }) {
  return (
    <ButtonLink
      {...props}
      onClick={(event) => {
        capture("cta_click", { label: ctaLabel, href: String(props.href) });
        onClick?.(event);
      }}
    />
  );
}

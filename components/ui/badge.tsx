import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "gold" | "olive" | "terracotta";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: "bg-ink/8 text-ink",
  // Darkened relative to --color-gold (#ac8968) for WCAG AA text contrast
  // against the badge's light background — the raw token is ~2.9:1 on cream.
  gold: "bg-gold/15 text-[#6f5944]",
  olive: "bg-olive/15 text-olive",
  terracotta: "bg-terracotta/15 text-terracotta",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "destructive";
type ButtonSize = "default" | "sm" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-terracotta text-cream hover:bg-terracotta/90",
  secondary: "border border-ink/20 text-ink hover:bg-ink/5",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

// All sizes keep a >=44px touch target (PRD 10.4) via min-height.
const SIZES: Record<ButtonSize, string> = {
  default: "h-11 px-5 text-sm",
  sm: "h-11 px-4 text-sm",
  lg: "h-12 px-7 text-base",
};

const BASE =
  "inline-flex min-w-[44px] items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-60";

/** Shared button class string, so links can be styled as buttons (see ButtonLink). */
export function buttonClasses({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

/** Brand button. One primary CTA per screen (PRD 10.4). */
export function Button({
  className,
  variant = "primary",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
}

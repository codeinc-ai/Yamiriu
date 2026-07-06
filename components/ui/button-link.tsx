import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses } from "./button";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg";
};

/** A next/link styled as a button (valid HTML for navigational CTAs). */
export function ButtonLink({
  variant = "primary",
  size = "default",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props} />
  );
}

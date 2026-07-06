import { cn } from "@/lib/utils";

/** Consistent section container: max-w-7xl, mobile-first py-16 / desktop py-24. */
export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm uppercase tracking-[0.2em] text-terracotta">
      {children}
    </p>
  );
}

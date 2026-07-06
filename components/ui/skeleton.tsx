import { cn } from "@/lib/utils";

/** Loading placeholder. Give it explicit dimensions to reserve layout space. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "motion-safe:animate-pulse rounded-md bg-ink/10",
        className
      )}
      {...props}
    />
  );
}

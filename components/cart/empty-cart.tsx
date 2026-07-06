import { ButtonLink } from "@/components/ui/button-link";

export function EmptyCart() {
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
        <path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4Z" />
        <path d="M4 6h16" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <h2 className="font-display text-2xl text-ink">Your cart is empty</h2>
      <p className="max-w-sm text-sm text-ink/70">
        Looks like you haven&apos;t added anything yet. Explore the collection
        and find something you love.
      </p>
      <ButtonLink href="/shop">Browse Products</ButtonLink>
    </div>
  );
}

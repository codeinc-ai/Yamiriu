import { ButtonLink } from "@/components/ui/button-link";

/** Secondary CTA shown only for products with a 3D model (PRD 4.3). */
export function OutfitBuilderCta({ productId }: { productId: string }) {
  return (
    <ButtonLink
      href={`/outfit-builder?item=${productId}`}
      variant="secondary"
      className="w-full"
    >
      Style This in the Outfit Builder
    </ButtonLink>
  );
}

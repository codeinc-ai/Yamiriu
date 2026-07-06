import { Badge } from "@/components/ui/badge";
import { CartLineItem, type CartLineDisplay } from "./cart-line-item";

/** Items styled together in the Outfit Builder — grouped visually, but each
 * still priced and removable independently (PRD 4.5, WF-005). */
export function OutfitGroup({
  items,
  onQuantityChange,
  onRemove,
}: {
  items: CartLineDisplay[];
  onQuantityChange: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-terracotta/25 bg-terracotta/[0.04] px-4">
      <div className="flex items-center gap-2 pt-4">
        <Badge variant="terracotta">Outfit</Badge>
        <span className="text-xs text-ink/60">Styled together</span>
      </div>
      <div className="divide-y divide-ink/10">
        {items.map((item) => (
          <CartLineItem
            key={item.variantId}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

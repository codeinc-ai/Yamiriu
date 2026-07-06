import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client cart store (PRD 2.7 — one Zustand store per domain). Persisted to
 * localStorage — cart contents only, never auth tokens (PRD Part A.2). Each
 * line is an individual product variant; outfit-builder items share an
 * `outfitGroupId` for visual grouping in the cart (PRD 4.5, WF-005).
 */
export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  /** Used only to derive a placeholder thumbnail (lib/product-images.ts). */
  category: "men" | "women" | "kids";
  price: string; // decimal PKR string
  size: string;
  color: string;
  quantity: number;
  outfitGroupId?: string;
}

interface CartState {
  items: CartItem[];
  /** Applied discount code (validated server-side at read time — see
   * actions/discounts.ts). Only the code is persisted; the discount amount is
   * always recomputed from the live subtotal, never trusted from storage. */
  discountCode: string | null;
  /** Applied gift card code — same pattern as discountCode: only the code is
   * persisted, the remaining balance is always re-validated server-side. */
  giftCardCode: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  setDiscountCode: (code: string | null) => void;
  setGiftCardCode: (code: string | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      discountCode: null,
      giftCardCode: null,
      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1;
          const existing = state.items.find(
            (i) => i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),
      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity } : i
                ),
        })),
      setDiscountCode: (code) => set({ discountCode: code }),
      setGiftCardCode: (code) => set({ giftCardCode: code }),
      clear: () => set({ items: [], discountCode: null, giftCardCode: null }),
    }),
    { name: "yamiriu-cart", version: 1 }
  )
);

export const selectCartCount = (state: CartState): number =>
  state.items.reduce((total, item) => total + item.quantity, 0);

export const selectCartSubtotal = (state: CartState): number =>
  state.items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

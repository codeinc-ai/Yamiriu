import { create } from "zustand";

/**
 * Client wishlist store (PRD 2.7 — one Zustand store per domain). Holds only
 * product ids; not persisted to localStorage — the DB (via Server Actions) is
 * the source of truth for logged-in users. `hydrate` seeds the store once from
 * a server-fetched list on mount (see WishlistHydrator).
 */
interface WishlistState {
  ids: string[];
  hydrated: boolean;
  hydrate: (ids: string[]) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
}

export const useWishlistStore = create<WishlistState>()((set) => ({
  ids: [],
  hydrated: false,
  hydrate: (ids) => set({ ids, hydrated: true }),
  add: (productId) =>
    set((state) => ({
      ids: state.ids.includes(productId) ? state.ids : [...state.ids, productId],
    })),
  remove: (productId) =>
    set((state) => ({ ids: state.ids.filter((id) => id !== productId) })),
}));

export const selectIsWishlisted = (productId: string) => (state: WishlistState) =>
  state.ids.includes(productId);

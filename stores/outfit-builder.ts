import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ShopCategory } from "@/lib/categories";
import type { OutfitSlot } from "@/lib/queries/outfit-builder";

/**
 * Client outfit-builder store (PRD 2.7 — one Zustand store per domain).
 * Persisted to sessionStorage only — "preserved across navigation within
 * the session" (WF-004), not indefinitely like the cart. Load-status fields
 * are excluded from persistence (`partialize`) — they're transient render
 * state, not meaningful across a reload.
 */
export interface OutfitItem {
  productId: string;
  slug: string;
  name: string;
  price: string;
  modelUrl: string;
  category: ShopCategory;
}

export type ModelLoadStatus = "loading" | "loaded" | "error";

interface GarmentLoad {
  status: ModelLoadStatus;
  /** Bumped by retryGarment to force the loader effect to re-run for the
   * same URL (a URL alone wouldn't change on retry). */
  retryNonce: number;
}

interface OutfitBuilderState {
  avatarType: ShopCategory;
  /** One selected item per slot — selecting a new item in an occupied slot
   * replaces the previous one (PRD 4.4). */
  selections: Partial<Record<OutfitSlot, OutfitItem>>;
  avatarLoadStatus: ModelLoadStatus;
  avatarRetryNonce: number;
  garmentLoad: Partial<Record<OutfitSlot, GarmentLoad>>;
  setAvatarType: (type: ShopCategory) => void;
  selectItem: (slot: OutfitSlot, item: OutfitItem) => void;
  deselectItem: (slot: OutfitSlot) => void;
  setAvatarLoadStatus: (status: ModelLoadStatus) => void;
  retryAvatar: () => void;
  setGarmentLoadStatus: (slot: OutfitSlot, status: ModelLoadStatus) => void;
  retryGarment: (slot: OutfitSlot) => void;
  /** Registered by the live 3D canvas (viewport-3d.tsx) while it's mounted —
   * null in 2D-fallback mode, letting thumbnail capture pick the right
   * strategy without duplicating WebGL-detection logic (lib/outfit-thumbnail.ts). */
  canvasCaptureFn: (() => string | null) | null;
  setCanvasCaptureFn: (fn: (() => string | null) | null) => void;
}

export const useOutfitBuilderStore = create<OutfitBuilderState>()(
  persist(
    (set) => ({
      avatarType: "men",
      selections: {},
      avatarLoadStatus: "loading",
      avatarRetryNonce: 0,
      garmentLoad: {},
      canvasCaptureFn: null,
      setAvatarType: (type) =>
        set((state) =>
          type === state.avatarType
            ? {}
            : { avatarType: type, selections: {}, garmentLoad: {}, avatarLoadStatus: "loading" }
        ),
      selectItem: (slot, item) =>
        set((state) => ({ selections: { ...state.selections, [slot]: item } })),
      deselectItem: (slot) =>
        set((state) => {
          const nextSelections = { ...state.selections };
          delete nextSelections[slot];
          const nextGarmentLoad = { ...state.garmentLoad };
          delete nextGarmentLoad[slot];
          return { selections: nextSelections, garmentLoad: nextGarmentLoad };
        }),
      setAvatarLoadStatus: (status) => set({ avatarLoadStatus: status }),
      retryAvatar: () => set((state) => ({ avatarRetryNonce: state.avatarRetryNonce + 1 })),
      setGarmentLoadStatus: (slot, status) =>
        set((state) => ({
          garmentLoad: {
            ...state.garmentLoad,
            [slot]: { status, retryNonce: state.garmentLoad[slot]?.retryNonce ?? 0 },
          },
        })),
      retryGarment: (slot) =>
        set((state) => ({
          garmentLoad: {
            ...state.garmentLoad,
            [slot]: {
              status: "loading",
              retryNonce: (state.garmentLoad[slot]?.retryNonce ?? 0) + 1,
            },
          },
        })),
      setCanvasCaptureFn: (fn) => set({ canvasCaptureFn: fn }),
    }),
    {
      name: "yamiriu-outfit-builder",
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ avatarType: state.avatarType, selections: state.selections }),
    }
  )
);

export const selectSelectionCount = (state: OutfitBuilderState): number =>
  Object.keys(state.selections).length;

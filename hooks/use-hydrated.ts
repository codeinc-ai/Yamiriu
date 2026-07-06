"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * True only after hydration. Uses useSyncExternalStore so the server snapshot is
 * `false` and the client snapshot is `true` — no setState-in-effect. Use to
 * avoid hydration mismatches when reading persisted client state (e.g. cart).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

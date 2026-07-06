"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Root smooth scroll (PRD 2.7, 10.5). Disabled for `prefers-reduced-motion` and
 * only activated after hydration so SSR and first client render match. Never
 * mixed with CSS `scroll-behavior: smooth`.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const hydrated = useHydrated();

  if (!hydrated || reduceMotion) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}

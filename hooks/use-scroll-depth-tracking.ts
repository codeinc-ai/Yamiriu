"use client";

import { useEffect } from "react";
import { capture } from "@/lib/analytics";

const THRESHOLDS = [25, 50, 75, 100] as const;

/** Fires `scroll_depth` once per threshold per page view (BLOCK 10) — mounted
 * only on landing + lookbook pages per PRD scope, not site-wide. */
export function useScrollDepthTracking() {
  useEffect(() => {
    const fired = new Set<number>();

    function handleScroll() {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;
      const percent = (window.scrollY / scrollableHeight) * 100;
      for (const threshold of THRESHOLDS) {
        if (percent >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          capture("scroll_depth", { percent: threshold });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
}

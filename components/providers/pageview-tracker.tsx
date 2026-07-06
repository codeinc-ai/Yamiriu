"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { capturePageview, registerUtmProperties } from "@/lib/analytics";

function PageviewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const url = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    // UTM attribution only needs to be captured once per landing, not
    // re-registered on every internal navigation afterward.
    if (isFirstRender.current) {
      registerUtmProperties(searchParams);
      isFirstRender.current = false;
    }

    capturePageview(url);
  }, [pathname, searchParams]);

  return null;
}

/** Wrapped in Suspense so `useSearchParams` only opts THIS subtree out of
 * static rendering, not the pages nested inside it (Next.js App Router
 * requirement — see PageviewTrackerInner). */
export function PageviewTracker() {
  return (
    <Suspense fallback={null}>
      <PageviewTrackerInner />
    </Suspense>
  );
}

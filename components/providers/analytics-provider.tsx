"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";
import { PageviewTracker } from "./pageview-tracker";

/**
 * PostHog init (PRD 2.8 / 13.3). No-ops when NEXT_PUBLIC_POSTHOG_KEY isn't
 * configured (see lib/analytics.ts) — safe in every environment.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);
  return (
    <>
      <PageviewTracker />
      {children}
    </>
  );
}

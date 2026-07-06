"use client";

import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { LenisProvider } from "./lenis-provider";
import { AnalyticsProvider } from "./analytics-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NuqsAdapter>
        <QueryProvider>
          <AnalyticsProvider>
            <LenisProvider>{children}</LenisProvider>
          </AnalyticsProvider>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ duration: 4000 }}
          />
        </QueryProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}

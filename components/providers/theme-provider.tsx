"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Light mode is the primary brand experience; dark mode is available (optional
// secondary) via the `class` attribute for later opt-in (PRD 10.2).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

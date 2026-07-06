"use client";

import { useEffect, useState } from "react";
import { detectWebglCapability } from "@/lib/webgl-support";

export type WebglSupportState = "checking" | "supported" | "unsupported";

/** "checking" only for the first client render (SSR-safe default), then
 * settles to "supported" or "unsupported" after the effect runs once. */
export function useWebglSupport(): WebglSupportState {
  const [state, setState] = useState<WebglSupportState>("checking");

  useEffect(() => {
    (async () => {
      setState(detectWebglCapability() ? "supported" : "unsupported");
    })();
  }, []);

  return state;
}

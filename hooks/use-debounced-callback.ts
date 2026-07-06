"use client";

import { useEffect, useRef } from "react";

/** Returns a debounced version of `callback` (PRD 10.7 — 300ms on filter inputs). */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs = 300
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  // Keep the ref pointed at the latest callback without mutating it during
  // render (React refs must only be written in effects/handlers).
  useEffect(() => {
    callbackRef.current = callback;
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (...args: Args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
  };
}

"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR-safe media-query subscription. Server snapshot returns `false`
 * so markup is rendered in its accessible, fully-visible default and
 * effects only attach after hydration.
 */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** User asked the OS for less motion — serve the static experience. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Touch-first hardware (phones/tablets): heavy layers are swapped for
 * optimized stills per the brief, independent of viewport width.
 */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(hover: none) and (pointer: coarse)");
}

/** Convenience: true when full cinematic effects should run. */
export function useCinematic(): boolean {
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  return !reduced && !coarse;
}

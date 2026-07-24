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

/**
 * Preview override: `?motion=force` in the URL makes the site behave as
 * if no reduced-motion preference were set — the full WebGL experience,
 * Lenis and every scroll reveal run regardless of OS settings. Built
 * for client review on machines where reduced motion is enabled
 * system-wide. It cannot conjure WebGL2 where the browser has none —
 * those visitors still get the static experience.
 */
function motionForced(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("motion") === "force";
  } catch {
    return false;
  }
}

/** User asked the OS for less motion — serve the static experience
 *  (unless the `?motion=force` preview override is present). */
export function useReducedMotion(): boolean {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return reduced && !motionForced();
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

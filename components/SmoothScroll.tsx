"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";

/**
 * Replaces native scrolling with Lenis inertia scrolling and keeps
 * ScrollTrigger in lock-step with it (Lenis drives window scroll, GSAP's
 * ticker drives Lenis — one clock for everything).
 *
 * Reduced motion: Lenis is never created; the page scrolls natively and
 * the `fx` class — which gates every hidden-until-animated style — is
 * never added, so all content is simply visible.
 */
const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/** Smooth-scroll to an element id, falling back to native scroll. */
export function useScrollTo() {
  const lenis = useLenis();
  return (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    } else {
      el.scrollIntoView({ behavior: "auto" });
    }
  };
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (reduced) return;

    document.documentElement.classList.add("fx");

    const instance = new Lenis({
      duration: 1.15,
      // Expo-style decay: fast response, long expensive settle.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.4,
    });

    instance.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    setLenis(instance);

    // Media/fonts change layout after hydration; re-measure triggers.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});

    return () => {
      window.removeEventListener("load", refresh);
      gsap.ticker.remove(raf);
      instance.destroy();
      setLenis(null);
      document.documentElement.classList.remove("fx");
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

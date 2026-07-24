"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";

interface Props {
  label: string;
  target: string;
}

/**
 * Hero scroll invitation: micro label, falling light line, next-chapter
 * pointer. Dissolves as soon as the journey begins (first 12% of hero
 * scroll) so it never lingers over Chapter 1.
 */
export default function ScrollCue({ label, target }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const tween = gsap.to(el, {
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: { start: 10, end: 260, scrub: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-10 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-4"
    >
      <span className="micro text-bone/50">{label}</span>
      <span className="cue-line" aria-hidden />
      <span className="micro text-champagne/80">{target}</span>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";
import { useScrollTo } from "@/components/SmoothScroll";

interface Props {
  lines: readonly string[];
  /** Element id to scroll to on activation. */
  target: string;
  /** Chapter section whose scroll progress fills the ring. */
  progressOf: string;
  className?: string;
}

const R = 74; // ring radius
const CIRC = 2 * Math.PI * R;

/**
 * Circular call-to-action: a hairline ring that fills clockwise with the
 * chapter's scroll progress (ScrollTrigger scrub writes stroke-dashoffset
 * directly — no React re-renders), a slowly rotating dashed halo for
 * life, and a two-line technical label. Micro-interactions ride Framer
 * Motion; easings stay slow and deliberate.
 */
export default function CircularCta({ lines, target, progressOf, className = "" }: Props) {
  const scrollTo = useScrollTo();
  const reduced = useReducedMotion();
  const progressRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    if (reduced) return;
    const circle = progressRef.current;
    const section = document.getElementById(progressOf);
    if (!circle || !section) return;

    gsap.set(circle, { strokeDasharray: CIRC, strokeDashoffset: CIRC });
    const tween = gsap.to(circle, {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.4,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [progressOf, reduced]);

  return (
    <motion.button
      type="button"
      onClick={() => scrollTo(target)}
      className={`group relative grid h-44 w-44 place-items-center rounded-full outline-offset-8 ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "tween", ease: [0.19, 1, 0.22, 1], duration: 0.7 }}
      aria-label={lines.join(" ")}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 176 176" fill="none" aria-hidden>
        {/* track */}
        <circle cx="88" cy="88" r={R} stroke="rgb(46 51 59 / 0.8)" strokeWidth="1" />
        {/* scroll progress */}
        <circle
          ref={progressRef}
          cx="88"
          cy="88"
          r={R}
          stroke="rgb(201 166 122 / 0.9)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="transition-colors duration-500 group-hover:stroke-champagne-bright"
        />
      </svg>
      {/* rotating dashed halo */}
      <svg className="cta-ring-spin absolute inset-2 h-[calc(100%-1rem)] w-[calc(100%-1rem)]" viewBox="0 0 160 160" fill="none" aria-hidden>
        <circle
          cx="80"
          cy="80"
          r="66"
          stroke="rgb(201 166 122 / 0.22)"
          strokeWidth="1"
          strokeDasharray="2 10"
        />
      </svg>
      <span className="micro relative text-center leading-[1.9] text-bone/80 transition-colors duration-500 group-hover:text-champagne-bright">
        {lines.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </span>
    </motion.button>
  );
}

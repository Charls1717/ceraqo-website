"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";

interface Props {
  children: ReactNode;
  className?: string;
  /** Stagger offset within a group (seconds of scrub-window shift). */
  index?: number;
}

/**
 * Draws hairline SVG icons on as they scroll into view: every geometry
 * element's stroke starts fully dashed-out and the dash offset is
 * scrubbed to zero. Manual dasharray math — no premium plugin
 * dependency. Reduced motion: icons are simply visible.
 */
export default function IconReveal({ children, className = "", index = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const shapes = el.querySelectorAll<SVGGeometryElement>(
      "path, circle, rect, line, polyline",
    );

    const ctx = gsap.context(() => {
      shapes.forEach((shape) => {
        const len = shape.getTotalLength?.() ?? 0;
        if (!len) return;
        gsap.set(shape, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(shape, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: `top ${92 - index * 3}%`,
            end: `top ${58 - index * 3}%`,
            scrub: 0.5,
          },
        });
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, index]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

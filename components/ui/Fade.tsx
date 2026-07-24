"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";

interface Props {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Extra scrub-window delay share within a group. */
  index?: number;
}

/**
 * Workhorse scroll entrance for supporting copy: rise + fade scrubbed
 * through a short window, reversible, invisible only when JS runs
 * (default CSS state is visible — progressive enhancement).
 */
export default function Fade({ children, className = "", as: Tag = "p", index = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.set(el, { autoAlpha: 0, y: 34 });
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: `top ${92 - index * 4}%`,
          end: `top ${62 - index * 4}%`,
          scrub: 0.5,
        },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced, index]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

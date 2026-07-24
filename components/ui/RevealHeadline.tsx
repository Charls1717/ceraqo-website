"use client";

import { useEffect, useRef, type ElementType } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/usePrefs";

interface Props {
  lines: readonly string[];
  as?: ElementType;
  className?: string;
  id?: string;
  /**
   * "scrub": fill progress rides the scrollbar (chapter headlines).
   * "load": plays once shortly after mount (hero only).
   */
  mode?: "scrub" | "load";
}

/**
 * The signature headline treatment: each line exists twice — a ghost
 * copy drawn only as thin champagne strokes, and the real fill copy
 * hidden behind a clip-path. On scroll the strokes surface first, then
 * the solid fill wipes across and the ghost dissolves, so letters
 * appear to solidify out of wireframe.
 *
 * Without JS (or with reduced motion) the CSS default is the fully
 * filled state — nothing is ever invisible. All hidden initial states
 * are applied by GSAP behind the `.fx` gate.
 */
export default function RevealHeadline({
  lines,
  as: Tag = "h2",
  className = "",
  id,
  mode = "scrub",
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      const lineEls = gsap.utils.toArray<HTMLElement>(".rh-line", root);

      lineEls.forEach((line, i) => {
        const stroke = line.querySelector<HTMLElement>(".rh-stroke");
        const clip = line.querySelector<HTMLElement>(".rh-clip");
        if (!stroke || !clip) return;

        // Hidden start: ghost invisible, fill fully clipped, line sunk.
        gsap.set(stroke, { opacity: 0 });
        gsap.set(clip, { clipPath: "inset(-6% 106% -6% -6%)" });
        gsap.set(line, { yPercent: 24 });

        const tl = gsap.timeline(
          mode === "scrub"
            ? {
                scrollTrigger: {
                  trigger: line,
                  start: "top 88%",
                  end: "top 46%",
                  scrub: 0.6,
                },
              }
            : { delay: 0.35 + i * 0.14 },
        );

        tl.to(line, { yPercent: 0, ease: "power4.out", duration: 0.9 }, 0)
          .to(stroke, { opacity: 1, ease: "none", duration: 0.35 }, 0)
          .to(
            clip,
            { clipPath: "inset(-6% -6% -6% -6%)", ease: "power2.inOut", duration: 0.75 },
            0.22,
          )
          .to(stroke, { opacity: 0, ease: "none", duration: 0.3 }, 0.6);
      });
    }, root);

    return () => ctx.revert();
  }, [reduced, mode, lines]);

  return (
    <Tag ref={rootRef as never} id={id} className={`display ${className}`}>
      {lines.map((text) => (
        <span key={text} className="rh-line">
          <span className="rh-stroke" aria-hidden>
            {text}
          </span>
          <span className="rh-clip block">
            <span className="rh-fill">{text}</span>
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Re-measure after images/videos settle so scrub windows stay honest. */
export function refreshTriggersSoon() {
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

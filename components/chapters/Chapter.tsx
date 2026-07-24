"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import AmbientVideo from "@/components/ui/AmbientVideo";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCinematic } from "@/lib/usePrefs";
import type { VideoAsset } from "@/lib/media";

export interface Scene {
  key: string;
  video?: VideoAsset;
  still?: string;
}

interface Props {
  id: string;
  /** One scene per subsection; scene i sits behind subsection i. */
  scenes: Scene[];
  children: ReactNode;
  className?: string;
  /**
   * WebGL mode: the live three.js world is the background, so the
   * sticky scene stage is skipped entirely and subsections flow as
   * plain content above the canvas.
   */
  bare?: boolean;
}

/**
 * The chapter stage. A full-viewport background layer sticks while the
 * chapter's subsections scroll over it; entering subsection i scrubs a
 * crossfade (opacity + settle-scale) from scene i-1 to scene i, so the
 * world changes exactly as the reader crosses each threshold.
 *
 * The stage's top/bottom dissolve into page ink via CSS masks
 * (.chapter-bg::before/after), which is what makes consecutive chapters
 * blend without a global orchestrator. Only the scene currently on
 * stage keeps its video decoding — the rest are paused stills.
 *
 * Subsections must carry `data-sub` in DOM order matching `scenes`.
 */
export default function Chapter({ id, scenes, children, className = "", bare = false }: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const cinematic = useCinematic();
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    if (bare) return;
    const root = rootRef.current;
    if (!root) return;

    const subs = Array.from(root.querySelectorAll<HTMLElement>("[data-sub]"));
    const sceneEls = Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"));
    if (!subs.length || !sceneEls.length) return;

    const ctx = gsap.context(() => {
      // Crossfades: subsection i (i>0) drives scene i-1 → i.
      if (cinematic) {
        subs.forEach((sub, i) => {
          if (i === 0) return;
          const incoming = sceneEls[i];
          if (!incoming) return;
          gsap.set(incoming, { opacity: 0, scale: 1.06 });
          gsap.to(incoming, {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sub,
              start: "top 80%",
              end: "top 25%",
              scrub: 0.5,
            },
          });
        });

        // Slow settle on the first scene while the chapter enters.
        const first = sceneEls[0];
        if (first) {
          gsap.fromTo(
            first,
            { scale: 1.08 },
            {
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: root,
                start: "top bottom",
                end: "top top",
                scrub: 0.5,
              },
            },
          );
        }
      }

      // Active-scene bookkeeping (which video may decode).
      subs.forEach((sub, i) => {
        ScrollTrigger.create({
          trigger: sub,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => self.isActive && setActiveScene(i),
        });
      });
    }, root);

    return () => ctx.revert();
  }, [cinematic, scenes.length, bare]);

  if (bare) {
    return (
      <section ref={rootRef} id={id} className={`relative ${className}`}>
        {children}
      </section>
    );
  }

  return (
    <section ref={rootRef} id={id} className={`relative ${className}`}>
      {/* sticky stage */}
      <div className="chapter-bg sticky top-0 h-screen overflow-hidden">
        {scenes.map((scene, i) => (
          <div key={scene.key} data-scene={scene.key} className="scene scene-vignette">
            {scene.video ? (
              <AmbientVideo
                video={scene.video}
                className="absolute inset-0"
                active={activeScene === i}
              />
            ) : scene.still ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scene.still}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* subsections flow over the stage */}
      <div className="relative z-10 -mt-[100vh]">{children}</div>
    </section>
  );
}

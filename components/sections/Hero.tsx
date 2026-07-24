"use client";

import { useEffect, useRef } from "react";
import AmbientVideo from "@/components/ui/AmbientVideo";
import RevealHeadline from "@/components/ui/RevealHeadline";
import ScrollCue from "@/components/ui/ScrollCue";
import { gsap } from "@/lib/gsap";
import { useCinematic, useReducedMotion } from "@/lib/usePrefs";
import { HERO } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * Opening scene: the Higgsfield hero loop full-bleed, "SURFACE.
 * REDEFINED." solidifying from strokes on load, one-line positioning
 * statement, scroll cue. The section is 135vh tall so the sticky frame
 * holds while the content parallaxes away — the first taste of the
 * scroll grammar used by every chapter.
 */
export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const cinematic = useCinematic();
  const reduced = useReducedMotion();

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const ctx = gsap.context(() => {
      if (!reduced) {
        // Supporting lines follow the headline in.
        gsap.from("[data-hero-fade]", {
          autoAlpha: 0,
          y: 28,
          duration: 1.4,
          stagger: 0.16,
          delay: 0.9,
          ease: "power4.out",
        });
      }
      if (cinematic) {
        // Content lifts and dims as the reader leaves the hero.
        gsap.to(content, {
          yPercent: -18,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom 65%",
            scrub: 0.5,
          },
        });
      }
    }, content);

    return () => ctx.revert();
  }, [cinematic, reduced]);

  return (
    <section id="top" className="relative h-[135vh]">
      <div className="chapter-bg sticky top-0 h-screen overflow-hidden">
        <div className="scene scene-vignette">
          <AmbientVideo video={MEDIA.heroLoop} className="absolute inset-0" />
        </div>

        <div
          ref={contentRef}
          className="absolute inset-0 z-[3] flex flex-col justify-center px-6 md:px-14 lg:px-20"
        >
          <p data-hero-fade className="micro mb-6 text-champagne">
            {HERO.kicker}
          </p>
          <RevealHeadline
            as="h1"
            lines={HERO.headline}
            mode="load"
            className="text-[12vw] leading-[0.92] md:text-[9.5vw] lg:text-[8vw]"
          />
          <p data-hero-fade className="prose-block mt-8">
            {HERO.sub}
          </p>
        </div>

        <ScrollCue label={HERO.cue} target={HERO.cueTarget} />
      </div>
    </section>
  );
}

"use client";

import Fade from "@/components/ui/Fade";
import { OPENING } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * "The Opening" — Hero → Science bridge.
 *
 * WebGL mode: a 320vh scroll runway; the cap-lift → droplet → nanolayer
 * choreography renders in the 3D layer (HeroBottle), fully reversible.
 *
 * Static mode (prefers-reduced-motion / no WebGL2): the same beat as a
 * still — the film-moment frame rendered from the real scene — so the
 * chapter is never silently skipped (v3 brief: every animated layer has
 * a static fallback image).
 */
export default function Opening({ webgl = false }: { webgl?: boolean }) {
  if (webgl) {
    return (
      <section id="opening" className="relative h-[320vh]" aria-label="The opening">
        <div className="sticky top-0 flex h-screen items-end px-6 pb-24 md:px-14 lg:px-20">
          <div className="webgl-copy relative max-w-sm">
            <Fade className="micro mb-3 text-champagne">{OPENING.kicker}</Fade>
            <Fade className="text-sm leading-relaxed text-steel" index={1}>
              {OPENING.note}
            </Fade>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="opening" className="relative" aria-label="The opening">
      <div className="relative min-h-screen overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MEDIA.openingStill}
          alt="A drop of Q-ARMOR spreading into a thin protective film beside the bottle"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="scene-vignette absolute inset-0" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-16 md:px-14 lg:px-20">
          <p className="micro mb-3 text-champagne">{OPENING.kicker}</p>
          <p className="max-w-sm text-sm leading-relaxed text-steel">{OPENING.note}</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import Fade from "@/components/ui/Fade";
import { OPENING } from "@/lib/copy";

/**
 * "The Opening" — the scroll runway for the cap-lift → droplet →
 * nanolayer choreography (Part B, rendered entirely in the WebGL
 * layer by HeroBottle). The DOM contributes only a whisper of copy;
 * the 3D scene is the narrative. 320vh gives the sequence a slow,
 * fully reversible scrub.
 */
export default function Opening() {
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

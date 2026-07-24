"use client";

import Chapter from "@/components/chapters/Chapter";
import RevealHeadline from "@/components/ui/RevealHeadline";
import CircularCta from "@/components/ui/CircularCta";
import IconReveal from "@/components/ui/IconReveal";
import Icon from "@/components/ui/Icons";
import Fade from "@/components/ui/Fade";
import { SCIENCE } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * Chapter 01 — THE SCIENCE.
 * Scene 1: the crystalline layer curing (Higgsfield macro loop).
 * Scene 2: the coating cross-section still behind the technology pillars.
 */
export default function Science({ webgl = false }: { webgl?: boolean }) {
  return (
    <Chapter
      id="science"
      bare={webgl}
      scenes={[
        { key: "crystal", video: MEDIA.scienceCrystal },
        { key: "layer", still: MEDIA.scienceLayerStill },
      ]}
    >
      {/* 01a — the invisible shield (headline lives in-scene in WebGL mode) */}
      <div data-sub className="flex min-h-screen items-center px-6 md:px-14 lg:px-20">
        <div className={`max-w-3xl pt-28 ${webgl ? "webgl-copy relative" : ""}`}>
          <Fade className="micro mb-6 text-champagne">{SCIENCE.shield.kicker}</Fade>
          {webgl ? (
            <h2 className="sr-only">{SCIENCE.shield.headline.join(" ")}</h2>
          ) : (
            <RevealHeadline
              lines={SCIENCE.shield.headline}
              className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
            />
          )}
          <Fade className="prose-block mt-8">{SCIENCE.shield.body}</Fade>
        </div>
      </div>

      {/* mid-chapter circular CTA */}
      <div className="flex justify-center py-24 md:py-32">
        <CircularCta
          lines={SCIENCE.cta.lines}
          target={SCIENCE.cta.target}
          progressOf="science"
        />
      </div>

      {/* 01b — technology pillars */}
      <div
        data-sub
        id="science-pillars"
        className="flex min-h-screen items-center px-6 py-28 md:px-14 lg:px-20"
      >
        <div className="w-full max-w-6xl">
          <Fade className="micro mb-6 text-champagne">{SCIENCE.pillars.kicker}</Fade>
          <RevealHeadline
            lines={SCIENCE.pillars.headline}
            className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
          />
          <Fade className="prose-block mt-6">{SCIENCE.pillars.body}</Fade>

          <div className="mt-14 grid gap-px bg-seam/40 sm:grid-cols-2 lg:grid-cols-3">
            {SCIENCE.pillars.items.map((item, i) => (
              <IconReveal key={item.title} index={i % 3} className="group bg-ink/70 p-7 backdrop-blur-sm transition-colors duration-700 hover:bg-gunmetal/70">
                <Icon name={item.icon} className="h-8 w-8 text-champagne" />
                <h3 className="mt-5 font-body text-[0.95rem] font-medium tracking-wide2 text-bone/90">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-steel">{item.note}</p>
              </IconReveal>
            ))}
          </div>

          <Fade className="mt-10 max-w-3xl text-sm leading-relaxed text-steel/80">
            {SCIENCE.pillars.footnote}
          </Fade>
        </div>
      </div>
    </Chapter>
  );
}

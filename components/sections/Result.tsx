"use client";

import Chapter from "@/components/chapters/Chapter";
import RevealHeadline from "@/components/ui/RevealHeadline";
import CircularCta from "@/components/ui/CircularCta";
import Fade from "@/components/ui/Fade";
import { RESULT } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * Chapter 03 — THE RESULT.
 * Scene 1: water-beading payoff macro behind the gloss statements.
 * Scene 2: gloss reflection still behind maintenance + provenance.
 */
export default function Result() {
  return (
    <Chapter
      id="result"
      scenes={[
        { key: "beading", video: MEDIA.resultBeading },
        { key: "gloss", still: MEDIA.glossStill },
      ]}
    >
      {/* 03a — the payoff */}
      <div data-sub className="flex min-h-screen items-center px-6 md:px-14 lg:px-20">
        <div className="w-full max-w-5xl pt-28">
          <Fade className="micro mb-6 text-champagne">{RESULT.gloss.kicker}</Fade>
          <RevealHeadline
            lines={RESULT.gloss.headline}
            className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
          />

          {/* the approved experience lines, revealed one by one */}
          <ul className="mt-10 max-w-xl">
            {RESULT.gloss.lines.map((line, i) => (
              <Fade as="li" key={line} index={i % 3} className="flex items-center gap-4 border-b hairline border-b-[1px] py-4">
                <span className="h-1 w-1 rounded-full bg-champagne" aria-hidden />
                <span className="text-[1.05rem] text-bone/80">{line}</span>
              </Fade>
            ))}
          </ul>

          {/* headline claims */}
          <div className="mt-14 grid max-w-3xl grid-cols-3 gap-6">
            {RESULT.gloss.stats.map((s, i) => (
              <Fade as="div" key={s.label} index={i}>
                <div className="display text-4xl text-champagne md:text-6xl">{s.value}</div>
                <div className="micro mt-2 text-steel">{s.unit}</div>
                <div className="mt-1 text-sm text-bone/70">{s.label}</div>
              </Fade>
            ))}
          </div>
        </div>
      </div>

      {/* mid-chapter circular CTA */}
      <div className="flex justify-center py-24 md:py-32">
        <CircularCta
          lines={RESULT.cta.lines}
          target={RESULT.cta.target}
          progressOf="result"
        />
      </div>

      {/* 03b — ownership */}
      <div
        data-sub
        id="result-maintenance"
        className="flex min-h-screen items-center px-6 py-28 md:px-14 lg:px-20"
      >
        <div className="w-full max-w-5xl">
          <Fade className="micro mb-6 text-champagne">{RESULT.maintenance.kicker}</Fade>
          <RevealHeadline
            lines={RESULT.maintenance.headline}
            className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
          />
          <Fade className="prose-block mt-8">{RESULT.maintenance.body}</Fade>

          <div className="mt-12 flex flex-wrap gap-4">
            <Fade as="div" className="panel px-7 py-5">
              <div className="micro text-champagne">Coverage</div>
              <div className="mt-1.5 text-bone/85">{RESULT.maintenance.coverage}</div>
            </Fade>
            <Fade as="div" index={1} className="panel px-7 py-5">
              <div className="micro text-champagne">Provenance</div>
              <div className="mt-1.5 text-bone/85">{RESULT.maintenance.origin}</div>
            </Fade>
          </div>

          <Fade className="mt-10 max-w-3xl text-[0.8125rem] leading-relaxed text-steel/70">
            {RESULT.footnote}
          </Fade>
        </div>
      </div>
    </Chapter>
  );
}

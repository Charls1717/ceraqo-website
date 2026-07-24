"use client";

import Chapter from "@/components/chapters/Chapter";
import RevealHeadline from "@/components/ui/RevealHeadline";
import CircularCta from "@/components/ui/CircularCta";
import IconReveal from "@/components/ui/IconReveal";
import Icon from "@/components/ui/Icons";
import Fade from "@/components/ui/Fade";
import { APPLICATION } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * Chapter 02 — THE APPLICATION.
 * Scene 1: the applicator-pad wipe loop behind the three steps.
 * Scene 2: the three-piece kit still behind owners + kit contents.
 */
export default function Application({ webgl = false }: { webgl?: boolean }) {
  return (
    <Chapter
      id="application"
      bare={webgl}
      scenes={[
        { key: "wipe", video: MEDIA.applicationWipe },
        { key: "kit", still: MEDIA.kitStill },
      ]}
    >
      {/* 02a — professional results, simple process (headline in-scene in WebGL mode) */}
      <div data-sub className="flex min-h-screen items-center px-6 md:px-14 lg:px-20">
        <div className={`w-full max-w-5xl pt-28 ${webgl ? "webgl-copy relative" : ""}`}>
          <Fade className="micro mb-6 text-champagne">{APPLICATION.process.kicker}</Fade>
          {webgl ? (
            <h2 className="sr-only">{APPLICATION.process.headline.join(" ")}</h2>
          ) : (
            <RevealHeadline
              lines={APPLICATION.process.headline}
              className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
            />
          )}
          <Fade className="prose-block mt-8">{APPLICATION.process.body}</Fade>

          {/* three-step indicator */}
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
            {APPLICATION.process.steps.map((step, i) => (
              <IconReveal key={step.n} index={i} className="relative">
                <li className="flex flex-col gap-4">
                  <span className="relative grid h-16 w-16 place-items-center">
                    <svg viewBox="0 0 64 64" fill="none" className="absolute inset-0" aria-hidden>
                      <circle cx="32" cy="32" r="30" stroke="rgb(46 51 59)" strokeWidth="1" />
                      <circle cx="32" cy="32" r="30" stroke="rgb(201 166 122 / 0.9)" strokeWidth="1.5" transform="rotate(-90 32 32)" />
                    </svg>
                    <span className="font-tech text-lg text-champagne">{step.n}</span>
                  </span>
                  <div>
                    <h3 className="display text-2xl text-bone/90">{step.title}</h3>
                    <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-steel">
                      {step.note}
                    </p>
                  </div>
                </li>
              </IconReveal>
            ))}
          </ol>
        </div>
      </div>

      {/* mid-chapter circular CTA */}
      <div className="flex justify-center py-24 md:py-32">
        <CircularCta
          lines={APPLICATION.cta.lines}
          target={APPLICATION.cta.target}
          progressOf="application"
        />
      </div>

      {/* 02b — every owner + the kit */}
      <div
        data-sub
        id="application-kit"
        className="flex min-h-screen items-center px-6 py-28 md:px-14 lg:px-20"
      >
        <div className="w-full max-w-6xl">
          <Fade className="micro mb-6 text-champagne">{APPLICATION.owners.kicker}</Fade>
          <RevealHeadline
            lines={APPLICATION.owners.headline}
            className="text-[11vw] md:text-[6.2vw] lg:text-[5vw]"
          />
          <Fade className="prose-block mt-6">{APPLICATION.owners.body}</Fade>

          {/* persona callouts */}
          <div className="mt-12 grid gap-px bg-seam/40 sm:grid-cols-2 lg:grid-cols-5">
            {APPLICATION.owners.personas.map((p, i) => (
              <IconReveal key={p.title} index={i % 5} className="bg-ink/70 p-6 backdrop-blur-sm transition-colors duration-700 hover:bg-gunmetal/70">
                <Icon name={p.icon} className="h-8 w-8 text-champagne" />
                <h3 className="mt-4 font-body text-sm font-medium tracking-wide2 text-bone/90">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-steel">{p.note}</p>
              </IconReveal>
            ))}
          </div>

          {/* kit contents */}
          <div className="mt-16 grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
            <div>
              <Fade className="micro mb-4 text-champagne">{APPLICATION.kit.kicker}</Fade>
              <RevealHeadline
                lines={APPLICATION.kit.headline}
                className="text-[8vw] md:text-[3.2vw]"
              />
            </div>
            <div className="panel p-8">
              <ul className="divide-y divide-seam/50">
                {APPLICATION.kit.items.map((item) => (
                  <li key={item.n} className="flex items-baseline gap-5 py-4">
                    <span className="font-tech text-xs text-champagne">{item.n}</span>
                    <span className="text-[0.95rem] text-bone/85">{item.label}</span>
                  </li>
                ))}
              </ul>
              <Fade className="mt-5 text-sm leading-relaxed text-steel">
                {APPLICATION.kit.coverage}
              </Fade>
            </div>
          </div>
        </div>
      </div>
    </Chapter>
  );
}

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import macroCap from "@/assets/macro_cap.png";
import macroEngraving from "@/assets/macro_engraving.png";
import waterBead from "@/assets/water_bead.png";
import goldLiquid from "@/assets/gold_liquid.png";

gsap.registerPlugin(ScrollTrigger);

const items = [
  { img: macroCap, caption: "The cap · 72 machined ridges" },
  { img: macroEngraving, caption: "The engraving · gold on matte" },
  { img: waterBead, caption: "The bead · water, unwelcome" },
  { img: goldLiquid, caption: "The formula · liquid armor" },
];

export function LookCloser() {
  const secRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!secRef.current || !trackRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduce || mobile) return;

    const track = trackRef.current;
    const total = track.scrollWidth - window.innerWidth;
    const st = ScrollTrigger.create({
      trigger: secRef.current,
      start: "top top",
      end: `+=${total + 200}`,
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        gsap.set(track, { x: -total * self.progress });
      },
    });
    return () => { st.kill(); };
  }, []);

  return (
    <section ref={secRef} id="closer" className="relative overflow-hidden bg-[color:var(--frame)]">
      <div className="px-6 sm:px-12 pt-24 pb-8 flex items-end justify-between">
        <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em]">Look <span className="font-[700] text-gold">closer.</span></h2>
        <span className="hidden md:block text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Scroll →</span>
      </div>
      <div ref={trackRef} className="flex gap-6 sm:gap-8 px-6 sm:px-12 pb-24 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none">
        {items.map((it) => (
          <figure key={it.caption} className="shrink-0 w-[80vw] md:w-[46vw] snap-center">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl hairline">
              <img src={it.img} alt={it.caption} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">{it.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/lib/hooks";
import {
  DIVE_ZONES,
  MANIFEST,
  formatMag,
  magnificationAt,
  zoneAt,
  type ZoneContent,
} from "./manifest";
import { useFrameSequence } from "./useFrameSequence";
import { DiveStills } from "./DiveStills";

gsap.registerPlugin(ScrollTrigger);

/* Color grade endpoints: the light studio and the void at the bond. */
const BG_LIGHT: [number, number, number] = [246, 240, 242]; // #F6F0F2
const BG_DARK: [number, number, number] = [8, 7, 10];
const HUD_DARK = "#141414";
const HUD_LIGHT = "#F2EEF0";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): string {
  return `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(
    lerp(a[2], b[2], t),
  )})`;
}

function mixHudColor(t: number): string {
  // #141414 -> #F2EEF0
  return mixRgb([20, 20, 20], [242, 238, 240], t);
}

/**
 * THE DIVE — one unbroken cinematic zoom from the bottle in the studio down
 * to the quartz lattice, scrubbed by scroll across five zones. Scrolling
 * down IS diving in: every zone multiplies the magnification.
 */
export function DiveExperience() {
  const reduce = useReducedMotion();
  return reduce ? <DiveStills /> : <DivePinned />;
}

function DivePinned() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const magRef = useRef<HTMLSpanElement>(null);
  const frameCounterRef = useRef<HTMLSpanElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [activeZone, setActiveZone] = useState<ZoneContent>(DIVE_ZONES[0]);
  const lastDrawn = useRef<HTMLImageElement | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  const frameSet = useMemo(() => {
    if (isMobile === null) return null;
    return isMobile ? MANIFEST.mobile : MANIFEST.desktop;
  }, [isMobile]);

  const { nearest, coarseReady, loadedCount, total } = useFrameSequence(frameSet);

  const drawImage = (img: HTMLImageElement | null) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    const w = Math.round(c.clientWidth * dpr);
    const h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    if (!img || !img.complete || img.naturalWidth === 0) return;
    lastDrawn.current = img;
    const ir = img.naturalWidth / img.naturalHeight;
    const cr = w / h;
    let dw = w,
      dh = h,
      dx = 0,
      dy = 0;
    if (ir > cr) {
      dh = h;
      dw = h * ir;
      dx = (w - dw) / 2;
    } else {
      dw = w;
      dh = w / ir;
      dy = (h - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  /** Single scrub update: frame, HUD readouts, color grade — all via refs. */
  const update = (p: number) => {
    progressRef.current = p;
    if (!frameSet) return;

    const frame = Math.round(p * (frameSet.count - 1));
    drawImage(nearest(frame));

    // Magnification counter (log scale through the zones)
    if (magRef.current) magRef.current.textContent = formatMag(magnificationAt(p));
    if (frameCounterRef.current) {
      frameCounterRef.current.textContent = `${String(frame + 1).padStart(4, "0")} / ${String(
        frameSet.count,
      ).padStart(4, "0")}`;
    }

    // Background grade #F6F0F2 -> near-black across the spread
    const darkT = clamp01(p / 0.55);
    if (bgRef.current) bgRef.current.style.background = mixRgb(BG_LIGHT, BG_DARK, darkT);

    // Champagne glow breathes in for the bond + lattice
    if (glowRef.current) {
      const glowT = clamp01((p - 0.58) / 0.25);
      glowRef.current.style.opacity = String(0.14 * glowT);
    }

    // HUD ink flips to light as the ambient light dies
    const hudT = clamp01((p - 0.3) / 0.18);
    if (hudRef.current) hudRef.current.style.setProperty("--hud", mixHudColor(hudT));

    // Right rail progress
    if (railFillRef.current) railFillRef.current.style.transform = `scaleY(${p})`;

    // Intro fades out over the first 5%, outro appears at the very end
    if (introRef.current) {
      const o = clamp01(1 - p / 0.05);
      introRef.current.style.opacity = String(o);
      introRef.current.style.visibility = o <= 0.01 ? "hidden" : "visible";
    }
    if (outroRef.current) {
      outroRef.current.style.opacity = String(clamp01((p - 0.965) / 0.03));
    }

    const z = zoneAt(p);
    setActiveZone((prev) => (prev.key === z.key ? prev : z));
  };

  useEffect(() => {
    if (!frameSet || !sectionRef.current || !pinRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: isMobile ? "+=420%" : "+=560%",
      pin: pinRef.current,
      scrub: 0.5,
      anticipatePin: 1,
      onUpdate: (self) => update(self.progress),
    });
    update(progressRef.current);

    const onResize = () => drawImage(lastDrawn.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      st.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameSet, coarseReady]);

  const loadPct = total > 0 ? Math.round((loadedCount / total) * 100) : 0;

  return (
    <section ref={sectionRef} id="product" className="relative">
      <div ref={pinRef} className="h-screen w-full relative overflow-hidden">
        {/* graded backdrop */}
        <div ref={bgRef} className="absolute inset-0" style={{ background: "#F6F0F2" }} />
        {/* frame sequence */}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
        {/* champagne glow for the bond */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 55%, rgba(245,160,60,0.55), rgba(255,183,99,0.12) 55%, transparent 75%)",
            mixBlendMode: "screen",
          }}
        />

        {/* ——— HUD ——— */}
        <div
          ref={hudRef}
          className="absolute inset-0 pointer-events-none select-none"
          style={{ ["--hud" as string]: HUD_DARK, color: "var(--hud)" }}
        >
          {/* corner ticks */}
          {[
            "top-5 left-5 border-t border-l",
            "top-5 right-5 border-t border-r",
            "bottom-5 left-5 border-b border-l",
            "bottom-5 right-5 border-b border-r",
          ].map((cls) => (
            <div key={cls} className={`absolute h-4 w-4 ${cls}`} style={{ borderColor: "var(--hud)", opacity: 0.5 }} />
          ))}

          {/* top-left: magnification meter */}
          <div className="absolute top-8 left-8 sm:top-12 sm:left-14">
            <div className="text-[9px] tracking-[0.32em] uppercase opacity-60">
              Q-Armor · Dive log
            </div>
            <div
              className="mt-2 text-3xl sm:text-5xl font-[300] tracking-[-0.01em]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <span ref={magRef}>1×</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[9px] tracking-[0.28em] uppercase opacity-60">
              <span className="inline-block h-px w-10" style={{ background: "var(--hud)" }} />
              <span>Magnification</span>
            </div>
          </div>

          {/* top-right: zone index */}
          <div className="absolute top-8 right-8 sm:top-12 sm:right-14 text-right">
            <div className="text-[9px] tracking-[0.32em] uppercase opacity-60">Zone</div>
            <div className="mt-2 text-sm sm:text-base tracking-[0.24em] uppercase">
              {String(activeZone.index + 1).padStart(2, "0")} — {activeZone.key}
            </div>
          </div>

          {/* right rail: zones */}
          <div className="absolute right-8 sm:right-14 top-1/2 -translate-y-1/2 hidden md:flex items-stretch gap-4">
            <div className="flex flex-col justify-between py-1 text-right">
              {DIVE_ZONES.map((z) => (
                <div
                  key={z.key}
                  className="text-[9px] tracking-[0.3em] uppercase transition-all duration-500"
                  style={{
                    opacity: activeZone.key === z.key ? 1 : 0.35,
                    color: activeZone.key === z.key ? "var(--gold)" : "var(--hud)",
                  }}
                >
                  {z.key}
                </div>
              ))}
            </div>
            <div className="relative w-px" style={{ background: "color-mix(in srgb, var(--hud) 25%, transparent)" }}>
              <div
                ref={railFillRef}
                className="absolute inset-x-0 top-0 h-full origin-top"
                style={{ background: "linear-gradient(180deg, var(--gold), var(--gold-2))", transform: "scaleY(0)" }}
              />
            </div>
          </div>

          {/* bottom-left: frame counter */}
          <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-14 text-[9px] tracking-[0.3em] uppercase opacity-60" style={{ fontVariantNumeric: "tabular-nums" }}>
            <span>Frame </span>
            <span ref={frameCounterRef}>0001 / 0000</span>
            {loadPct < 100 && <span className="ml-4 text-gold">Optics {loadPct}%</span>}
          </div>

          {/* bottom-center: pinned zone copy — one datasheet fact per zone */}
          <div className="absolute inset-x-0 bottom-16 sm:bottom-20 flex justify-center px-6">
            <div className="relative w-full max-w-3xl h-28 sm:h-32">
              {DIVE_ZONES.map((z) => {
                const active = activeZone.key === z.key;
                return (
                  <div
                    key={z.key}
                    className="absolute inset-0 flex flex-col items-center justify-end text-center transition-all duration-700"
                    style={{
                      opacity: active ? 1 : 0,
                      transform: `translateY(${active ? 0 : 14}px)`,
                    }}
                  >
                    <div className="text-[9px] tracking-[0.32em] uppercase mb-3 text-gold">
                      {String(z.index + 1).padStart(2, "0")} · {z.title}
                    </div>
                    <p className="text-xl sm:text-3xl font-[300] tracking-[-0.01em] leading-snug">
                      {z.fact}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ——— intro overlay: the dive IS the hero ——— */}
        <div
          ref={introRef}
          className="absolute inset-0 pointer-events-none select-none flex flex-col items-center justify-between py-24 sm:py-28"
          style={{ color: HUD_DARK }}
        >
          <div className="text-center px-6">
            <h1 className="text-[13vw] sm:text-[7.5vw] leading-[0.95] tracking-[-0.02em] font-[300]">
              Where your car meets
              <span className="block font-[700] text-gold">the untouchable.</span>
            </h1>
            <p className="mt-5 text-xs sm:text-sm tracking-[0.02em] text-[color:var(--muted-foreground)] max-w-md mx-auto">
              Q-ARMOR — a silane quartz coating in 500 numbered bottles. Scroll: descending is
              magnifying.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-[9px] tracking-[0.32em] uppercase opacity-60">
              Begin the dive · 1× → 1,000,000×
            </span>
            <span
              className="block h-10 w-px"
              style={{
                background: "linear-gradient(180deg, var(--gold), transparent)",
                animation: "floaty 2.4s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* ——— outro chip: the shield holds ——— */}
        <div
          ref={outroRef}
          className="absolute inset-x-0 top-[24%] flex justify-center pointer-events-none select-none opacity-0"
          style={{ color: HUD_LIGHT }}
        >
          <div className="text-center">
            <div className="text-[9px] tracking-[0.4em] uppercase text-gold">Shield complete</div>
            <div className="mt-2 text-2xl sm:text-4xl font-[300] tracking-[-0.01em]">
              The crystal holds.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

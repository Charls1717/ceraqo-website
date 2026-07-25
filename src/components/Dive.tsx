import { useEffect, useMemo, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ZONES, magnificationAt, formatMagnification } from '../data/zones';
import { FRAME_MANIFEST, type FrameProfile } from '../hooks/useFrameLoader';
import type { FrameStore } from '../lib/frameStore';

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance dedicated to each frame of the sequence. */
const PX_PER_FRAME = 22;

/** Per-tick catch-up factor for the smoothed frame cursor. */
const LERP = 0.24;

/**
 * Canvas backing-store DPR cap, independent of the fetched image tier.
 * Committing the canvas to the compositor costs raster time in
 * proportion to backing pixels; 1.25 costs ~39%% of dpr2 and ~69%% of
 * the old 1.5 cap — the difference is invisible in motion on Retina
 * panels and directly buys scrub headroom on MacBooks. The decode
 * worker sizes bitmaps to the same cap so blits stay 1:1.
 */
const DPR_CAP = 1.25;

/** Zone-local fade windows for the fact copy (fractions of the zone). */
const FACT_WINDOWS = [
  { in0: 0.3, in1: 0.42, out0: 0.78, out1: 0.92 }, // object — after the hero clears
  { in0: 0.14, in1: 0.26, out0: 0.78, out1: 0.92 }, // drop
  { in0: 0.14, in1: 0.26, out0: 0.78, out1: 0.92 }, // spread
  { in0: 0.14, in1: 0.26, out0: 0.78, out1: 0.92 }, // bond
  { in0: 0.08, in1: 0.18, out0: 0.46, out1: 0.6 }, // lattice — over the locked crystal
];

interface DiveProps {
  storeRef: RefObject<FrameStore | null>;
  profile: FrameProfile;
  /** true once the preloader has finished — switches the HUD on */
  active: boolean;
}

export default function Dive({ storeRef, profile, active }: DiveProps) {
  const info = FRAME_MANIFEST[profile];
  const zones = FRAME_MANIFEST.zones;
  const count = info.count;

  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const magRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const zoneItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const trackHeight = useMemo(
    () => `calc(${Math.max(count * PX_PER_FRAME, 4800)}px + 100vh)`,
    [count],
  );

  /** Glide the page so the scrub lands a beat into the given zone. */
  const jumpToZone = (zoneIndex: number) => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const z = zones[zoneIndex];
    const targetFrame = Math.min(z.start + 12, z.end);
    const p = targetFrame / Math.max(count - 1, 1);
    // The track no longer starts at the page top (hero + intro precede
    // it): map progress onto the track's own scroll span.
    const top = track.getBoundingClientRect().top + window.scrollY;
    const span = track.offsetHeight - window.innerHeight;
    const lenis = (
      window as unknown as {
        __lenis?: { scrollTo: (t: number, o?: object) => void };
      }
    ).__lenis;
    const target = Math.round(top + p * span);
    if (lenis) lenis.scrollTo(target, { duration: 2.6 });
    else window.scrollTo(0, target);
  };

  /** Zone frame ranges normalised to overall progress [0, 1]. */
  const zoneWindows = useMemo(() => {
    const denom = Math.max(count - 1, 1);
    return zones.map((z) => ({
      from: z.start / denom,
      to: z.end / denom,
    }));
  }, [zones, count]);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas || count === 0) return;

    // alpha:false — the stage is opaque, and an opaque canvas composites
    // without a blend pass.
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const resize = () => {
      const stage = canvas.parentElement!;
      cssW = stage.clientWidth;
      cssH = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      needsDraw = true;
    };

    // The scroll drives a fractional frame cursor; the canvas cross-fades
    // between the two adjacent frames and eases toward the target, so
    // motion stays continuous at any scroll speed instead of stepping
    // from frame to frame.
    let targetF = 0;
    let displayF = 0;
    let targetIndex = 0;
    let needsDraw = true;
    let inView = true;
    let drawnExact = false;

    const coverDraw = (bmp: ImageBitmap, alpha: number) => {
      const iw = bmp.width;
      const ih = bmp.height;
      if (!iw || !ih) return;
      const scale = Math.max(cssW / iw, cssH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(bmp, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
    };

    // Draws only worker-decoded ImageBitmaps from the sliding window —
    // never anything that would trigger a synchronous decode.
    const draw = (blend: boolean) => {
      if (cssW === 0 || cssH === 0) return;
      const store = storeRef.current;
      if (!store) return;
      const i0 = blend ? Math.floor(displayF) : Math.round(displayF);
      const i1 = Math.min(i0 + 1, count - 1);
      const frac = displayF - i0;
      const exact = store.get(i0);
      const a = exact ?? store.nearest(i0);
      if (!a) return;
      drawnExact = !!exact;
      const ds = (window.__diveStats ??= { draws: 0, fallbackDraws: 0 });
      ds.draws++;
      if (!exact) ds.fallbackDraws++;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      coverDraw(a, 1);
      if (blend && frac > 0.01 && i1 !== i0) {
        const b = store.get(i1);
        if (b) coverDraw(b, frac);
      }
      ctx.globalAlpha = 1;
    };

    // Adaptive quality: the cross-fade costs a second full-frame blit,
    // which weak GPUs / software rasterizers can't spare. Watch the real
    // tick interval and fall back to single-frame drawing when the
    // machine is struggling (with hysteresis so it doesn't flap).
    let blendOn = true;
    let emaInterval = 16.7;
    let lastDrawnF = -1;
    // Reduced motion: no eased cursor, no cross-fade — the canvas
    // repaints only when the target frame index actually changes.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tick = (_t: number, deltaTime: number) => {
      if (deltaTime > 0 && deltaTime < 120) {
        emaInterval = emaInterval * 0.92 + deltaTime * 0.08;
        if (blendOn && emaInterval > 26) blendOn = false;
        else if (!blendOn && emaInterval < 17.5) blendOn = true;
      }
      if (!inView) return;
      const diff = targetF - displayF;
      if (reduceMotion) {
        if (displayF !== targetF) {
          displayF = targetF;
          needsDraw = true;
        }
      } else if (Math.abs(diff) > 0.0015) {
        displayF += diff * LERP;
        if (Math.abs(targetF - displayF) < 0.0015) displayF = targetF;
        needsDraw = true;
      }
      // A fallback neighbour was shown and the real bitmap has since
      // arrived from the worker — repaint with the exact frame.
      if (!needsDraw && !drawnExact && storeRef.current?.get(Math.round(displayF))) {
        needsDraw = true;
      }
      // Skip only true sub-pixel repaints of a frame we already show —
      // never suppress catch-up (the old >40ms limiter did, and reads as
      // a freeze-then-snap on screen).
      if (needsDraw && drawnExact && Math.abs(displayF - lastDrawnF) < 0.02) {
        needsDraw = false;
      }
      if (needsDraw) {
        needsDraw = false;
        lastDrawnF = displayF;
        draw(blendOn && !reduceMotion);
      }
    };
    gsap.ticker.add(tick);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: '80px 0px' },
    );
    io.observe(track);

    // --- HUD + overlay driving -------------------------------------
    const setOverlay = (el: HTMLElement | null, opacity: number, shift: number) => {
      if (!el) return;
      const o = Math.min(1, Math.max(0, opacity));
      el.style.opacity = o.toFixed(3);
      const centred =
        el.classList.contains('overlay--zone') || el.classList.contains('overlay--hero');
      el.style.transform = centred
        ? `translateY(calc(-50% + ${shift.toFixed(1)}px))`
        : `translateY(${shift.toFixed(1)}px)`;
      el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    };

    let lastZone = -1;
    let lastMagText = '';
    let prevIndex = 0;

    const update = (p: number) => {
      targetF = p * (count - 1);
      targetIndex = Math.round(targetF);
      if (targetIndex !== prevIndex) {
        // Aim the worker's decode window at the new position
        storeRef.current?.request(targetIndex, targetIndex > prevIndex ? 1 : -1);
        prevIndex = targetIndex;
      }

      // Magnification counter
      const magText = formatMagnification(magnificationAt(p));
      if (magText !== lastMagText && magRef.current) {
        magRef.current.textContent = magText;
        lastMagText = magText;
      }
      if (depthRef.current) {
        depthRef.current.textContent = `DEPTH ${(p * 1.2).toFixed(2)} µm`;
      }

      // Active zone on the rail
      let zi = 0;
      for (let i = 0; i < zoneWindows.length; i++) {
        if (p >= zoneWindows[i].from) zi = i;
      }
      if (zi !== lastZone) {
        zoneItemRefs.current.forEach((el, i) => {
          el?.setAttribute('data-active', i === zi ? 'true' : 'false');
        });
        lastZone = zi;
      }

      // Hero copy rides the opening frame: hold at the top, gone by
      // ~4.5% progress so the descent takes over immediately.
      const heroOpacity = 1 - p / 0.045;
      setOverlay(heroRef.current, heroOpacity, -p * 300);
      setOverlay(hintRef.current, heroOpacity, 0);

      // Zone facts: fade in after the zone starts, out before it ends.
      // Windows are tuned per zone so copy always sits over a settled,
      // legible moment of the film: zone 1 yields to the hero headline,
      // zone 5 speaks over the locked lattice and leaves before the
      // fast pull-back out of the surface.
      overlayRefs.current.forEach((el, i) => {
        const w = zoneWindows[i];
        if (!el || !w) return;
        const span = Math.max(w.to - w.from, 0.0001);
        const t = (p - w.from) / span;
        const win = FACT_WINDOWS[i] ?? FACT_WINDOWS[1];
        let o = 0;
        if (t >= win.in0 && t <= win.out1) {
          if (t < win.in1) o = (t - win.in0) / (win.in1 - win.in0);
          else if (t > win.out0) o = 1 - (t - win.out0) / (win.out1 - win.out0);
          else o = 1;
        }
        const shift = (1 - Math.min(1, Math.max(0, (t - win.in0) / (win.out1 - win.in0)))) * 26 - 8;
        setOverlay(el, o, shift);
      });
    };

    const st = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => update(self.progress),
    });

    update(0);

    return () => {
      st.kill();
      io.disconnect();
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, [storeRef, count, zoneWindows]);

  return (
    <section ref={trackRef} className="dive-track" style={{ height: trackHeight }} aria-label="The Q-ARMOR dive">
      <div className="dive-stage">
        <canvas ref={canvasRef} className="dive-canvas" aria-hidden="true" />
        <div className="dive-grade" />
        <div className="dive-vignette" />
        <div className="dive-grain" />
        <div className="finder" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        {/* Hero copy over frame 0 — the page opens inside the scrub */}
        <div ref={heroRef} className="overlay overlay--hero" style={{ opacity: 1 }}>
          <div className="overlay__brand wordmark">
            CERAQO<sup className="hero__tm">™</sup> <span>/</span> Q-ARMOR
          </div>
          <div className="overlay__kicker">Advanced Surface Protection</div>
          <h1 className="overlay__title">The Future of Vehicle Protection Starts Here.</h1>
        </div>
        <div ref={hintRef} className="overlay overlay--hint" style={{ opacity: 1 }}>
          <span className="micro">Scroll to descend</span>
          <span className="overlay__hint-line" />
        </div>

        {/* Zone facts */}
        {ZONES.map((zone, i) => (
          <div
            key={zone.id}
            ref={(el) => {
              overlayRefs.current[i] = el;
            }}
            className="overlay overlay--zone"
          >
            <div className="overlay__kicker">
              Zone 0{i + 1} — {zone.kicker}
            </div>
            <p className="overlay__fact">{zone.fact}</p>
            <div className="overlay__meta">
              <span className="overlay__index">
                {String(i + 1).padStart(2, '0')} / {String(ZONES.length).padStart(2, '0')}
              </span>
              <span className="overlay__meta-rule" />
            </div>
          </div>
        ))}

        {/* HUD */}
        <div ref={hudRef} className="hud" data-on={active ? 'true' : 'false'}>
          <div className="hud__corner hud__corner--tl">
            <div className="hud__brand wordmark">
              CERAQO <span style={{ color: 'var(--c-cyan)' }}>/</span> Q-ARMOR
            </div>
            <div className="hud__sub">Surface dive — unbroken shot</div>
          </div>

          <div className="hud__corner hud__corner--bl">
            <div className="hud__mag-label">Magnification</div>
            <div ref={magRef} className="hud__mag">
              1.0×
            </div>
          </div>

          <div className="hud__corner hud__corner--br">
            <div ref={depthRef} className="hud__depth">
              DEPTH 0.00 µm
            </div>
            <div className="hud__sub">covalent interface scan</div>
          </div>

          <div className="hud__rail">
            {ZONES.map((zone, i) => (
              <button
                key={zone.id}
                type="button"
                ref={(el) => {
                  zoneItemRefs.current[i] = el;
                }}
                className="hud__zone"
                data-active={i === 0 ? 'true' : 'false'}
                aria-label={`Jump to zone ${i + 1} — ${zone.kicker}`}
                onClick={() => jumpToZone(i)}
              >
                <span className="hud__zone-num">0{i + 1}</span>
                {zone.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ZONES, magnificationAt, formatMagnification } from '../data/zones';
import { FRAME_MANIFEST } from '../hooks/useFrameLoader';

gsap.registerPlugin(ScrollTrigger);

/** Scroll distance dedicated to each frame of the sequence. */
const PX_PER_FRAME = 16;

interface DiveProps {
  imagesRef: RefObject<(HTMLImageElement | undefined)[]>;
  profile: 'desktop' | 'mobile';
  /** true once the preloader has finished — switches the HUD on */
  active: boolean;
}

export default function Dive({ imagesRef, profile, active }: DiveProps) {
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
  const zoneItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const trackHeight = useMemo(
    () => `calc(${Math.max(count * PX_PER_FRAME, 4800)}px + 100vh)`,
    [count],
  );

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const resize = () => {
      const stage = canvas.parentElement!;
      cssW = stage.clientWidth;
      cssH = stage.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      needsDraw = true;
    };

    let targetIndex = 0;
    let drawnIndex = -1;
    let needsDraw = true;
    let inView = true;

    const nearestLoaded = (index: number): HTMLImageElement | undefined => {
      const images = imagesRef.current ?? [];
      if (images[index]?.complete) return images[index];
      for (let d = 1; d < count; d++) {
        const lo = images[index - d];
        if (lo?.complete) return lo;
        const hi = images[index + d];
        if (hi?.complete) return hi;
      }
      return undefined;
    };

    const draw = () => {
      const img = nearestLoaded(targetIndex);
      if (!img || cssW === 0 || cssH === 0) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;
      const scale = Math.max(cssW / iw, cssH / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      drawnIndex = targetIndex;
    };

    const tick = () => {
      if (!inView) return;
      if (needsDraw || drawnIndex !== targetIndex) {
        needsDraw = false;
        draw();
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

    const update = (p: number) => {
      targetIndex = Math.round(p * (count - 1));

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

      // Hero overlay: hold at the very top, gone by ~4.5% progress
      const heroOpacity = 1 - p / 0.045;
      setOverlay(heroRef.current, heroOpacity, -p * 300);
      setOverlay(hintRef.current, heroOpacity, 0);

      // Zone facts: fade in after the zone starts, out before it ends
      overlayRefs.current.forEach((el, i) => {
        const w = zoneWindows[i];
        if (!el || !w) return;
        const span = Math.max(w.to - w.from, 0.0001);
        const t = (p - w.from) / span;
        // First zone copy must not fight the hero headline
        const inStart = i === 0 ? 0.3 : 0.14;
        const inEnd = i === 0 ? 0.42 : 0.26;
        const outStart = 0.78;
        const outEnd = 0.92;
        let o = 0;
        if (t >= inStart && t <= outEnd) {
          if (t < inEnd) o = (t - inStart) / (inEnd - inStart);
          else if (t > outStart) o = 1 - (t - outStart) / (outEnd - outStart);
          else o = 1;
        }
        const shift = (1 - Math.min(1, Math.max(0, (t - inStart) / (outEnd - inStart)))) * 26 - 8;
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
  }, [imagesRef, count, zoneWindows]);

  return (
    <section ref={trackRef} className="dive-track" style={{ height: trackHeight }} aria-label="The Q-ARMOR dive">
      <div className="dive-stage">
        <canvas ref={canvasRef} className="dive-canvas" aria-hidden="true" />
        <div className="dive-grade" />
        <div className="dive-vignette" />
        <div className="dive-grain" />

        {/* Hero overlay */}
        <div ref={heroRef} className="overlay overlay--hero" style={{ opacity: 1 }}>
          <div className="overlay__kicker micro">CERAQO — surface protection</div>
          <h1 className="overlay__title">How close will you look?</h1>
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
            <div className="overlay__index">
              {String(i + 1).padStart(2, '0')} / {String(ZONES.length).padStart(2, '0')}
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
              <div
                key={zone.id}
                ref={(el) => {
                  zoneItemRefs.current[i] = el;
                }}
                className="hud__zone"
                data-active={i === 0 ? 'true' : 'false'}
              >
                {zone.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

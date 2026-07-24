import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createOpeningScene, type OpeningScene } from '../lib/openingScene';
import { assetUrl } from '../lib/assetUrl';

gsap.registerPlugin(ScrollTrigger);

declare global {
  interface Window {
    /** Opening-scene telemetry for the QA suite */
    __openingState?: { t: number; mode: 'webgl' | 'poster' };
  }
}

/**
 * "The Opening" — the scroll-scrubbed WebGL bridge between the hero
 * and the story. A tall track pins the stage; ScrollTrigger progress
 * drives the scene timeline, so it plays forward on scroll-down and
 * in exact reverse on scroll-up.
 *
 * prefers-reduced-motion (and any machine without WebGL) gets a
 * static rendered still of the coated-panel end state instead.
 */
export default function Opening() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const [poster, setPoster] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene: OpeningScene | null = null;
    if (!reduceMotion) {
      scene = createOpeningScene(canvas);
    }
    if (!scene) {
      setPoster(true);
      window.__openingState = { t: 0, mode: 'poster' };
      return;
    }

    window.__openingState = { t: 0, mode: 'webgl' };

    let t = 0;
    let dirty = true;
    let inView = true;

    const resize = () => {
      const stage = canvas.parentElement!;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      scene!.setSize(stage.clientWidth, stage.clientHeight, dpr);
      dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView) dirty = true;
      },
      { rootMargin: '60px 0px' },
    );
    io.observe(track);

    // Fonts feed the procedural label texture; rebuild once they land.
    // (The scene draws with fallback fonts immediately either way.)

    const st = ScrollTrigger.create({
      trigger: track,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        t = self.progress;
        if (window.__openingState) window.__openingState.t = t;
        dirty = true;
        if (kickerRef.current) {
          const o = 1 - Math.min(1, t / 0.06);
          kickerRef.current.style.opacity = o.toFixed(3);
        }
      },
    });

    const tick = () => {
      if (!dirty || !inView) return;
      dirty = false;
      scene!.update(t);
      scene!.render();
    };
    gsap.ticker.add(tick);
    scene.update(0);
    scene.render();

    return () => {
      st.kill();
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      scene!.dispose();
    };
  }, []);

  return (
    <section ref={trackRef} className="opening" aria-label="The opening" data-poster={poster}>
      <div className="opening-stage">
        <div className="opening-streak" aria-hidden="true" />
        {poster ? (
          <img
            className="opening-poster"
            src={assetUrl('/opening/poster.webp')}
            alt="A drop of Q-ARMOR spreading into an even protective layer on a dark paint panel beside the bottle"
          />
        ) : (
          <canvas ref={canvasRef} className="opening-canvas" aria-hidden="true" />
        )}
        <div ref={kickerRef} className="opening-kicker">
          <span className="micro micro--cyan">The opening</span>
          <span className="opening-kicker__rule" />
        </div>
        <div className="finder" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
    </section>
  );
}

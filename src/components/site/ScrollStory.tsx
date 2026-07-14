import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import bottle from "@/assets/bottle.jpg";
import goldLiquid from "@/assets/gold_liquid.png";
import carHood from "@/assets/car_hood.png";

gsap.registerPlugin(ScrollTrigger);

const beats = [
  { at: 0.25, title: "The reveal — sealed until it isn't." },
  { at: 0.5, title: "The formula — liquid armor, awakened." },
  { at: 0.75, title: "The application — one layer. Every panel." },
  { at: 1.0, title: "The shield — set. sealed. untouchable." },
];

const frames = [bottle, goldLiquid, carHood];

export function ScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const imgs = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    let mounted = true;
    let done = 0;
    imgs.current = frames.map((src) => {
      const im = new Image();
      im.src = src;
      im.onload = () => { done++; if (mounted) setLoaded(done); };
      return im;
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !pinRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (p: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = c.clientWidth * dpr;
      const h = c.clientHeight * dpr;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      ctx.clearRect(0, 0, w, h);

      const seg = 1 / frames.length;
      const idx = Math.min(frames.length - 1, Math.floor(p / seg));
      const localT = (p - idx * seg) / seg; // 0..1
      const nextIdx = Math.min(frames.length - 1, idx + 1);
      const drawImg = (im: HTMLImageElement, alpha: number) => {
        if (!im.complete || im.naturalWidth === 0) return;
        ctx.globalAlpha = alpha;
        const ir = im.naturalWidth / im.naturalHeight;
        const cr = w / h;
        let dw = w, dh = h, dx = 0, dy = 0;
        if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; }
        else { dw = w; dh = w / ir; dy = (h - dh) / 2; }
        ctx.drawImage(im, dx, dy, dw, dh);
      };
      drawImg(imgs.current[idx], 1);
      if (nextIdx !== idx) drawImg(imgs.current[nextIdx], localT);
      ctx.globalAlpha = 1;
    };

    if (reduce) { draw(0); return; }

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "+=350%",
      pin: pinRef.current,
      scrub: 0.6,
      onUpdate: (self) => {
        setProgress(self.progress);
        draw(self.progress);
        if (bgRef.current) {
          const p = self.progress;
          bgRef.current.style.background = `rgb(${Math.round(246 - p * 232)}, ${Math.round(240 - p * 226)}, ${Math.round(242 - p * 228)})`;
        }
      },
    });
    draw(0);
    return () => { st.kill(); };
  }, [loaded]);

  const currentBeat = beats.findIndex((b) => progress <= b.at);
  const activeBeat = currentBeat === -1 ? beats.length - 1 : currentBeat;

  return (
    <section ref={sectionRef} id="product" className="relative">
      <div ref={pinRef} className="h-screen w-full relative overflow-hidden">
        <div ref={bgRef} className="absolute inset-0" style={{ background: "#F6F0F2" }} />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 sm:pb-24 pointer-events-none">
          {beats.map((b, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 px-6 sm:px-12 transition-all duration-700"
              style={{ opacity: i === activeBeat ? 1 : 0, transform: `translateY(${i === activeBeat ? 0 : 16}px)` }}
            >
              <p className="text-center text-2xl sm:text-4xl font-[300] tracking-[-0.01em] max-w-3xl mx-auto text-[color:var(--ink)] mix-blend-difference" style={{ color: "#F2EEF0" }}>
                {b.title.split(" ").map((w, k) => (
                  <span key={k} className="inline-block mr-[0.25em]" style={{ transitionDelay: `${k * 60}ms` }}>{w}</span>
                ))}
              </p>
            </div>
          ))}
          {/* progress */}
          <div className="absolute top-6 right-6 sm:top-10 sm:right-12 text-[10px] tracking-[0.2em] uppercase text-[color:#F2EEF0] mix-blend-difference">
            {String(Math.round(progress * 100)).padStart(2, "0")} / 100
          </div>
          {loaded < frames.length && (
            <div className="absolute top-6 left-6 sm:top-10 sm:left-12 text-[10px] tracking-[0.2em] uppercase text-gold">Loading · {loaded}/{frames.length}</div>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Droplet, Shield, Sparkle, Layers } from "lucide-react";
import bottle from "@/assets/bottle.jpg";

const stats = [
  { n: 500, s: "numbered bottles, Series One" },
  { n: 72, s: "machined ridges on every cap" },
  { n: 50, s: "ml — one car, one bottle" },
  { n: 2026, s: "first series" },
];

function Counter({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{v}</span>;
}

export function DarkExperience() {
  return (
    <section id="experience" className="relative py-32 sm:py-44 overflow-hidden" style={{ background: "#0B0A0C", color: "#F2EEF0" }}>
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      {/* glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[80vh] w-[80vh] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(245,160,60,0.35), transparent 60%)", animation: "goldglow 5s ease-in-out infinite" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-12 gap-8 items-center">
        <div className="col-span-12 lg:col-span-6 relative flex items-center justify-center">
          {/* rim glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: "radial-gradient(circle, rgba(245,160,60,0.5), transparent 60%)" }} />
            <motion.img
              src={bottle}
              alt="Ceraqo Q-Armor bottle with gold rim glow"
              className="relative h-[70vh] w-auto object-contain"
              style={{ WebkitMaskImage: "radial-gradient(ellipse 55% 70% at 50% 50%, black 60%, transparent 92%)", maskImage: "radial-gradient(ellipse 55% 70% at 50% 50%, black 60%, transparent 92%)", filter: "drop-shadow(0 0 30px rgba(245,160,60,0.35))" }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* floating badges */}
            {[
              { Icon: Droplet, x: -140, y: -100, d: 0 },
              { Icon: Shield, x: 150, y: -80, d: 0.8 },
              { Icon: Sparkle, x: -160, y: 120, d: 1.4 },
              { Icon: Layers, x: 160, y: 140, d: 2.0 },
            ].map(({ Icon, x, y, d }, i) => (
              <motion.div
                key={i}
                className="absolute h-12 w-12 rounded-full flex items-center justify-center"
                style={{ top: "50%", left: "50%", marginTop: y, marginLeft: x, border: "1px solid rgba(245,160,60,0.5)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)" }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: d }}
              >
                <Icon size={16} className="text-gold" strokeWidth={1.25} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-[300] tracking-[-0.02em] leading-[0.95]">
            All the protection you need<br />
            <span className="font-[700] text-gold">is now alive.</span>
          </h2>
          <p className="mt-6 text-[color:#B4AEB0] max-w-md">A shield awakened by contact — engineered to bond, to gleam, to endure.</p>

          <div className="mt-14 grid grid-cols-2 gap-8">
            {stats.map((s) => (
              <div key={s.s}>
                <div className="text-4xl sm:text-5xl font-[300] text-gold"><Counter to={s.n} /></div>
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[color:#8E8A8C]">{s.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

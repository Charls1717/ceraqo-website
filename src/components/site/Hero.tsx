import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import bottle from "@/assets/bottle.jpg";

const words1 = ["Where", "your", "car"];
const words2 = ["meets", "the"];

export function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const el = wrapRef.current;
    if (!el) return;
    const on = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width;
      const dy = (e.clientY - cy) / r.height;
      setTilt({ x: dx * 6, y: -dy * 6 });
    };
    window.addEventListener("mousemove", on);
    return () => window.removeEventListener("mousemove", on);
  }, []);

  return (
    <section id="top" className="relative min-h-[100vh] flex items-center overflow-hidden pt-24 pb-16">
      {/* soft gold radial behind bottle */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[70vh] w-[70vh] rounded-full blur-3xl opacity-70" style={{ background: "radial-gradient(circle, rgba(245,160,60,0.35), rgba(245,160,60,0) 60%)" }} />
      </div>

      {/* Bottle */}
      <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: tilt.x, rotateX: tilt.y }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          className="relative"
        >
          <motion.img
            src={bottle}
            alt="Ceraqo Q-Armor 50ml matte black bottle with gold cap"
            fetchPriority="high"
            className="h-[62vh] sm:h-[68vh] w-auto object-contain select-none pointer-events-none"
            style={{ WebkitMaskImage: "radial-gradient(ellipse 55% 70% at 50% 50%, black 60%, transparent 92%)", maskImage: "radial-gradient(ellipse 55% 70% at 50% 50%, black 60%, transparent 92%)" }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Text overlays */}
      <div className="relative z-10 grid grid-cols-12 gap-6 w-full px-6 sm:px-12">
        <h1 className="col-span-12 md:col-span-6 text-[10vw] md:text-[6.4vw] leading-[0.95] tracking-[-0.02em] font-[300]">
          <span className="block">
            {words1.map((w, i) => (
              <motion.span key={w} className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
            ))}
          </span>
          <span className="block">
            {words2.map((w, i) => (
              <motion.span key={w} className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.35 + i * 0.08, duration: 0.7 }}>{w}</motion.span>
            ))}
            <motion.span className="inline-block font-[700] text-gold" initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.6, duration: 0.9 }}>Untouchable.</motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="col-span-12 md:col-start-8 md:col-span-5 mt-[42vh] md:mt-[36vh] text-sm md:text-[15px] leading-relaxed text-[color:var(--muted-foreground)] max-w-sm md:ml-auto"
        >
          Ceraqo Q-Armor is a new way to protect your car — a <span className="font-[700] text-[color:var(--ink)]">nano</span> armor engineered to outlast everything.
        </motion.p>
      </div>

      {/* Bottom-left asterisk */}
      <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-12 z-10">
        <svg width="28" height="28" viewBox="0 0 24 24" className="text-[color:var(--ink)]" style={{ animation: "slowspin 14s linear infinite" }} aria-hidden>
          <path fill="currentColor" d="M12 2v20M2 12h20M4.5 4.5l15 15M19.5 4.5l-15 15" strokeWidth="1" stroke="currentColor" />
        </svg>
      </div>

      {/* Bottom-right pills */}
      <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-10 flex gap-2">
        {["Gloss", "Protection", "Nano"].map((t) => (
          <span key={t} className="rounded-full hairline px-3 py-1 text-[11px] tracking-[0.15em] uppercase text-[color:var(--muted-foreground)]">{t}</span>
        ))}
      </div>
    </section>
  );
}

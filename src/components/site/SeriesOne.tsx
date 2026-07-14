import { motion } from "framer-motion";
import bottleMaster from "@/assets/bottle_master.webp";

/** The edition statement between the specification and the reserve CTA. */
export function SeriesOne() {
  return (
    <section id="series" className="relative overflow-hidden py-32 sm:py-44 px-6 sm:px-12" style={{ background: "#0B0A0C", color: "#F2EEF0" }}>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[70vh] w-[70vh] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(245,160,60,0.22), transparent 62%)", animation: "goldglow 6s ease-in-out infinite" }} />
      </div>
      <div className="relative max-w-6xl mx-auto grid grid-cols-12 items-center gap-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.9 }}
          className="col-span-12 md:col-span-7"
        >
          <div className="text-[10px] uppercase tracking-[0.32em] text-gold mb-6">Series One — 2026</div>
          <h2 className="text-5xl sm:text-7xl font-[300] leading-[0.98] tracking-[-0.02em]">
            <span className="font-[700] text-gold">500</span> numbered bottles.
            <span className="block">One car each.</span>
          </h2>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-[color:#B4AEB0]">
            Each 50 ml bottle is engraved with its number and matched to a single vehicle. When the
            series is gone, it is gone.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.1 }}
          className="col-span-12 md:col-span-5 flex justify-center"
        >
          <img
            src={bottleMaster}
            alt="Q-Armor bottle No. 001 of 500 — matte black aluminum with gold Ceraqo label"
            loading="lazy"
            className="h-[52vh] w-auto object-contain"
            style={{
              WebkitMaskImage: "radial-gradient(ellipse 60% 72% at 50% 50%, black 58%, transparent 92%)",
              maskImage: "radial-gradient(ellipse 60% 72% at 50% 50%, black 58%, transparent 92%)",
              filter: "drop-shadow(0 0 34px rgba(245,160,60,0.28))",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}

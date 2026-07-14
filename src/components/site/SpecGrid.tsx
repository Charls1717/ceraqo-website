import { motion } from "framer-motion";

const specs = [
  { n: "01", t: "9H heat-cured / 8H ambient", d: "Pencil hardness at the top of the scale — cured by heat or simply by air." },
  { n: "02", t: "Hydrophobic, oleophobic & stain-resistant", d: "Water, oil and grime lose their grip on the crystal surface." },
  { n: "03", t: "Blocks water and oxygen — a corrosion barrier", d: "The two ingredients of rust never reach the substrate." },
  { n: "04", t: "Auto, aviation, marine, military & transport", d: "Developed for the sectors where surfaces are not allowed to fail." },
  { n: "05", t: "Rims, headlights, glass, plastics & metals", d: "One chemistry for every hard surface on the vehicle." },
];

/** Datasheet callouts — continues the pure black the dive ends on. */
export function SpecGrid() {
  return (
    <section id="specs" className="relative overflow-hidden py-28 sm:py-36 px-6 sm:px-12" style={{ background: "#060507", color: "#F2EEF0" }}>
      {/* faint lattice glow carried over from the dive */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(245,160,60,0.14), transparent 70%)" }}
      />
      <div className="relative max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14 sm:mb-20">
          <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em] max-w-xl">
            Below the shimmer, <span className="font-[700] text-gold">the datasheet.</span>
          </h2>
          <p className="text-xs uppercase tracking-[0.24em] text-[color:#8E8A8C]">Q-Armor · specification</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.08)" }}>
          {specs.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ delay: i * 0.07, duration: 0.7 }}
              className="relative p-8 sm:p-10 min-h-52"
              style={{ background: "#060507" }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{s.n}</div>
              <h3 className="mt-4 text-xl sm:text-2xl font-[300] leading-snug tracking-[-0.01em]">{s.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:#8E8A8C]">{s.d}</p>
            </motion.div>
          ))}
          {/* closing tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="relative p-8 sm:p-10 min-h-52 flex flex-col justify-between"
            style={{ background: "linear-gradient(135deg, rgba(245,160,60,0.16), rgba(255,183,99,0.05))" }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Σ</div>
            <p className="text-xl sm:text-2xl font-[300] leading-snug tracking-[-0.01em]">
              A quartz shield, <span className="font-[700]">bonded for up to 72 months.</span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

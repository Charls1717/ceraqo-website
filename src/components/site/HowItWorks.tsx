import { motion } from "framer-motion";
import macroCap from "@/assets/macro_cap.png";
import goldLiquid from "@/assets/gold_liquid.png";
import waterBead from "@/assets/water_bead.png";

const steps = [
  { n: "01", t: "Prepare", d: "One panel at a time. Clean, cool, dry.", img: macroCap },
  { n: "02", t: "Apply", d: "A few drops. Cross-hatch. Let it flash.", img: goldLiquid },
  { n: "03", t: "Cure", d: "Walk away. The armor sets itself.", img: waterBead },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-28 sm:py-36 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em] max-w-xl">Three moves. <span className="font-[700] text-gold">Done.</span></h2>
          <p className="text-sm text-[color:var(--muted-foreground)] max-w-sm">A ritual short enough to fit an afternoon, calibrated to last for years.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              className="relative rounded-3xl overflow-hidden hairline bg-[color:var(--frame-2)]"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img src={s.img} alt={s.t} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                  <span>Step</span><span>{s.n}</span>
                </div>
                <h3 className="mt-3 text-2xl font-[700]">{s.t}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

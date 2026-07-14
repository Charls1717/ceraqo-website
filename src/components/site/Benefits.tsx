import { motion } from "framer-motion";
import { Atom, Sparkles, Droplets, Timer } from "lucide-react";

const items = [
  { Icon: Atom, t: "Nano protection", d: "A sub-micron armor bonds panel-deep — invisible, uncompromising." },
  { Icon: Sparkles, t: "Extreme gloss", d: "Optical depth you can feel. Wet-look, dry to the touch." },
  { Icon: Droplets, t: "Hydrophobic effect", d: "Water beads. Dirt lifts. Contact becomes a rumor." },
  { Icon: Timer, t: "Durability", d: "Engineered to outlast — season after season, wash after wash." },
];

export function Benefits() {
  return (
    <section id="benefits" className="relative py-28 sm:py-36 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em] max-w-2xl">A quieter kind of <span className="font-[700] text-gold">strength.</span></h2>
          <span className="hidden md:block text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Series One — 001</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.t}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ delay: i * 0.08, duration: 0.7 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-3xl p-6 sm:p-8 hairline bg-[color:var(--frame-2)] transition-colors"
            >
              <div className="h-10 w-10 rounded-full flex items-center justify-center mb-6 bg-gold text-[#141414]">
                <it.Icon size={16} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-[700]">{it.t}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{it.d}</p>
              <div className="mt-8 pt-4 border-t text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">0{i + 1}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

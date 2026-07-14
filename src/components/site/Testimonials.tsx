import { motion } from "framer-motion";

const t = [
  { q: "It doesn't look coated. It looks correct. Like the paint finally arrived.", n: "M. Alderly", r: "Collector, London" },
  { q: "One panel in, I understood. The gloss is honest. The water is gone.", n: "R. Vieira", r: "Studio owner, Lisbon" },
  { q: "I've used every ceramic in the last decade. This isn't one of them.", n: "K. Nakashima", r: "Detailer, Tokyo" },
];

export function Testimonials() {
  return (
    <section className="relative py-28 sm:py-36 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em] mb-14 max-w-2xl">Held by the <span className="font-[700] text-gold">quiet few.</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {t.map((it, i) => (
            <motion.figure
              key={it.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="rounded-3xl p-8 hairline bg-[color:var(--frame-2)]"
            >
              <blockquote className="text-lg font-[300] leading-relaxed">"{it.q}"</blockquote>
              <figcaption className="mt-8 pt-6 border-t text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                <div className="text-[color:var(--ink)] font-[700] not-italic">{it.n}</div>
                <div className="mt-1">{it.r}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

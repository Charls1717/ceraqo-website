import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const faqs = [
  { q: "What is Q-Armor?", a: "Q-Armor is a new class of surface protection — a liquid nano armor that bonds with paint to form an ultra-thin, exceptionally durable shield." },
  { q: "How long does application take?", a: "A single vehicle takes about an afternoon: prepare one panel at a time, apply a few drops in a cross-hatch pattern, and let it flash and cure." },
  { q: "How is it different from ceramic coating?", a: "A new class of surface protection born from defense technology — engineered from the molecule up, not adapted from consumer coatings." },
  { q: "Do I need a professional?", a: "No. Q-Armor is designed to be applied by a careful owner. The formula is patient; the ritual is short." },
  { q: "When does Series One ship?", a: "Reserve your number to be notified — Series One is limited to 500 numbered bottles." },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative py-28 sm:py-36 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl sm:text-6xl font-[300] tracking-[-0.02em] mb-14">Questions, <span className="font-[700] text-gold">answered.</span></h2>
        <div className="divide-y divide-[color:var(--hairline)] border-t border-b">
          {faqs.map((f, i) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group"
                aria-expanded={open === i}
              >
                <span className="text-lg sm:text-xl font-[300] pr-8">{f.q}</span>
                <span className={`h-8 w-8 rounded-full hairline flex items-center justify-center transition-transform ${open === i ? "rotate-45 bg-gold text-[#141414]" : ""}`}>
                  <Plus size={14} strokeWidth={1.5} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-[color:var(--muted-foreground)] max-w-2xl">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

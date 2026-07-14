import { motion } from "framer-motion";
import carHood from "@/assets/car_hood.png";

export function Results() {
  return (
    <section className="relative h-[85vh] overflow-hidden">
      <motion.img
        src={carHood}
        alt="Ceraqo Q-Armor bottle on a supercar hood at dusk"
        loading="lazy"
        className="absolute inset-0 h-[120%] w-full object-cover"
        initial={{ y: -40 }}
        whileInView={{ y: 0 }}
        viewport={{ once: false, margin: "-20%" }}
        transition={{ duration: 1.2 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))" }} />
      <div className="relative z-10 h-full flex items-center justify-center px-6 sm:px-12">
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1 }}
          className="text-center text-4xl sm:text-6xl md:text-7xl font-[300] tracking-[-0.02em] max-w-4xl"
          style={{ color: "#F2EEF0" }}
        >
          Water never stood a <span className="font-[700] text-gold">chance.</span>
        </motion.blockquote>
      </div>
    </section>
  );
}

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import carHood from "@/assets/car_hood.png";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
});

function MagneticButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <motion.button
      ref={ref}
      {...(props as any)}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25 });
      }}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="rounded-full bg-gold px-8 py-4 text-sm font-[700] tracking-wide text-[#141414] hover:shadow-[0_20px_60px_-15px_rgba(245,160,60,0.6)] transition-shadow"
    >
      {children}
    </motion.button>
  );
}

export function Reserve() {
  const [state, setState] = useState<"idle" | "ok">("idle");
  const [err, setErr] = useState<{ name?: string; email?: string }>({});
  const [num, setNum] = useState(0);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ name: fd.get("name"), email: fd.get("email") });
    if (!parsed.success) {
      const errors: { name?: string; email?: string } = {};
      parsed.error.issues.forEach((i) => { errors[i.path[0] as "name" | "email"] = i.message; });
      setErr(errors);
      return;
    }
    setErr({});
    setNum(Math.floor(Math.random() * 400) + 1);
    setState("ok");
  };

  return (
    <section id="reserve" className="relative min-h-[90vh] overflow-hidden flex items-center py-24">
      <img src={carHood} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.85))" }} />
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 sm:px-12 text-center" style={{ color: "#F2EEF0" }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-7xl font-[300] tracking-[-0.02em]"
        >
          Reserve your <span className="font-[700] text-gold">number.</span>
        </motion.h2>
        <p className="mt-4 text-[color:#B4AEB0]">Series One — 500 numbered bottles. First shipments, 2026.</p>

        {state === "idle" ? (
          <form onSubmit={submit} className="mt-10 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 max-w-xl mx-auto">
            <div className="text-left">
              <input
                name="name"
                placeholder="Name"
                aria-label="Name"
                className="h-14 w-full rounded-full bg-white/5 border border-white/15 px-5 text-sm placeholder:text-white/40 focus:outline-none focus:border-[color:var(--gold)]"
              />
              {err.name && <p className="mt-1 pl-4 text-[11px] text-red-300">{err.name}</p>}
            </div>
            <div className="text-left">
              <input
                name="email"
                type="email"
                placeholder="Email"
                aria-label="Email"
                className="h-14 w-full rounded-full bg-white/5 border border-white/15 px-5 text-sm placeholder:text-white/40 focus:outline-none focus:border-[color:var(--gold)]"
              />
              {err.email && <p className="mt-1 pl-4 text-[11px] text-red-300">{err.email}</p>}
            </div>
            <MagneticButton type="submit">Reserve</MagneticButton>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-gold flex items-center justify-center text-[#141414] font-[700] text-2xl">{String(num).padStart(3, "0")}</div>
            <p className="mt-6 text-lg">You're in. We'll be in touch when your bottle is ready.</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}

import { Moon, Sun, ArrowUpRight } from "lucide-react";
import { useTheme, useHydrated } from "@/lib/hooks";

export function Nav() {
  const { theme, toggle } = useTheme();
  const hydrated = useHydrated();
  return (
    <header className="absolute top-0 left-0 right-0 z-40 px-6 sm:px-10 pt-6 sm:pt-8">
      <div className="flex items-start justify-between gap-4">
        {/* Left: two nav columns */}
        <nav aria-label="Primary" className="hidden md:grid grid-cols-2 gap-x-8 text-[11px] tracking-[0.18em] uppercase text-[color:var(--muted-foreground)]">
          <ul className="space-y-1.5">
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#product">Product</a></li>
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#pricing">Pricing</a></li>
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#faq">FAQ</a></li>
          </ul>
          <ul className="space-y-1.5">
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#how">How it works</a></li>
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#support">Support</a></li>
            <li><a className="hover:text-[color:var(--ink)] transition-colors" href="#contact">Contact</a></li>
          </ul>
        </nav>

        {/* Center: logo */}
        <a href="#top" className="group absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full" style={{ boxShadow: "inset 0 0 0 1px rgba(245,160,60,0.55)" }}>
            <span className="absolute inset-[3px] rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,183,99,0.18), transparent 65%)" }} />
            <span className="text-[11px] font-[300] tracking-[0.14em] text-[color:var(--ink)]">ceraqo</span>
          </span>
        </a>

        {/* Right: theme + arrow */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="h-10 w-10 rounded-full hairline flex items-center justify-center text-[color:var(--ink)] hover:bg-[color:var(--frame-2)] transition"
          >
            {hydrated && theme === "dark" ? <Sun size={16} strokeWidth={1.25} /> : <Moon size={16} strokeWidth={1.25} />}
          </button>
          <a
            href="#reserve"
            aria-label="Reserve"
            className="h-10 w-10 rounded-full bg-[color:var(--ink)] text-[color:var(--frame)] flex items-center justify-center hover:scale-105 transition"
          >
            <ArrowUpRight size={16} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="border-t hairline px-6 sm:px-12 py-14">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-4">
          <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full" style={{ boxShadow: "inset 0 0 0 1px rgba(245,160,60,0.55)" }}>
            <span className="text-[11px] tracking-[0.14em]">ceraqo</span>
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">Q-Armor · Series One</span>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
          <a href="#product" className="hover:text-[color:var(--ink)] transition">The dive</a>
          <a href="#specs" className="hover:text-[color:var(--ink)] transition">Specification</a>
          <a href="#faq" className="hover:text-[color:var(--ink)] transition">FAQ</a>
          <a href="#reserve" className="hover:text-[color:var(--ink)] transition">Reserve</a>
        </nav>
        <p className="text-[11px] text-[color:var(--muted-foreground)]">© 2026 ceraqo — Q-Armor. All rights reserved.</p>
      </div>
    </footer>
  );
}

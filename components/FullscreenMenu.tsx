"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import AmbientVideo from "@/components/ui/AmbientVideo";
import Icon from "@/components/ui/Icons";
import { useLenis, useScrollTo } from "@/components/SmoothScroll";
import { MEDIA } from "@/lib/media";
import { MENU } from "@/lib/copy";

interface Props {
  open: boolean;
  onClose: () => void;
}

const EASE = [0.19, 1, 0.22, 1] as const;

/** Curtain reveal + orchestrated stagger for the menu content. */
const curtain = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  show: {
    clipPath: "inset(0 0 0% 0)",
    transition: { ease: EASE, duration: 0.9 },
  },
  exit: {
    clipPath: "inset(0 0 100% 0)",
    transition: { ease: EASE, duration: 0.7, delay: 0.1 },
  },
};

const item = {
  hidden: { y: 48, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { ease: EASE, duration: 0.9, delay: 0.28 + i * 0.07 },
  }),
  exit: { opacity: 0, transition: { duration: 0.25 } },
};

/**
 * Fullscreen overlay menu. Giant chapter index on the left, utility
 * actions on the right, socials + legal at the bottom, ambient
 * Higgsfield loop behind everything. Scroll is frozen while open
 * (Lenis stop + html overflow for the native fallback); Escape closes;
 * focus moves in on open and back to the toggle on close.
 */
export default function FullscreenMenu({ open, onClose }: Props) {
  const lenis = useLenis();
  const scrollTo = useScrollTo();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    lenis?.stop();
    document.documentElement.style.overflow = "hidden";

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      lenis?.start();
      previouslyFocused?.focus?.();
    };
  }, [open, lenis, onClose]);

  const go = (target: string) => {
    onClose();
    // Let the curtain lift before travelling.
    setTimeout(() => scrollTo(target), 350);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="fullscreen-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-menu bg-ink"
          variants={curtain}
          initial="hidden"
          animate="show"
          exit="exit"
          ref={panelRef}
        >
          {/* ambient backdrop */}
          <AmbientVideo video={MEDIA.ambientMenu} className="absolute inset-0" dim={0.45} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/60" aria-hidden />

          {/* close (corner position per brief; nav burger also morphs to X) */}
          <motion.button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="absolute right-6 top-6 z-10 grid h-12 w-12 place-items-center text-bone/70 transition-colors hover:text-champagne md:right-10 md:top-7"
            variants={item}
            custom={0}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.25">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </motion.button>

          <div className="relative flex h-full flex-col justify-between px-6 pb-8 pt-28 md:px-14 md:pb-12">
            <div className="grid flex-1 content-center gap-14 md:grid-cols-[1.6fr_1fr] md:items-center">
              {/* chapter index */}
              <nav aria-label="Chapters">
                <ul className="space-y-2 md:space-y-4">
                  {MENU.chapters.map((c, i) => (
                    <motion.li key={c.target} variants={item} custom={i + 1} initial="hidden" animate="show" exit="exit">
                      <button
                        type="button"
                        onClick={() => go(c.target)}
                        aria-label={`Chapter ${c.index}: ${c.label}`}
                        className="group flex items-baseline gap-5 text-left"
                      >
                        <span className="micro text-champagne/70">{c.index}</span>
                        <span className="display text-[11vw] leading-none text-bone/85 transition-colors duration-500 group-hover:text-champagne md:text-[4.6vw]">
                          {c.label}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* utilities */}
              <div className="flex flex-col gap-3 md:items-end">
                {MENU.utilities.map((u, i) => (
                  <motion.a
                    key={u.label}
                    href={u.href}
                    onClick={(e) => {
                      if (u.href.startsWith("#")) {
                        e.preventDefault();
                        go(u.href.slice(1));
                      }
                    }}
                    className="micro w-full border border-seam/70 px-6 py-4 text-center text-bone/70 transition-all duration-500 hover:border-champagne/60 hover:text-champagne md:w-64"
                    variants={item}
                    custom={i + 4}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                  >
                    {u.label}
                  </motion.a>
                ))}
              </div>
            </div>

            {/* socials + legal */}
            <motion.div
              className="flex flex-col gap-6 border-t hairline pt-6 md:flex-row md:items-center md:justify-between"
              variants={item}
              custom={8}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="flex items-center gap-6">
                {MENU.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="text-bone/50 transition-colors duration-400 hover:text-champagne"
                  >
                    <Icon name={s.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <p className="micro text-bone/35">
                © {new Date().getFullYear()} CERAQO™ · Q-ARMOR™ · Made in Germany
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

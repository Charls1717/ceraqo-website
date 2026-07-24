"use client";

import { motion } from "framer-motion";
import { useScrollTo } from "@/components/SmoothScroll";

interface Props {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

const EASE = [0.19, 1, 0.22, 1] as const;

/**
 * Fixed transparent top bar: wordmark left, hamburger right. A soft
 * scrim gradient keeps both legible over bright scenes. The hamburger
 * morphs to a close cross and stays above the fullscreen menu, doubling
 * as its close control (the menu also renders its own X for the corner
 * position the brief asks for).
 */
export default function SiteNav({ menuOpen, onToggleMenu }: Props) {
  const scrollTo = useScrollTo();

  return (
    <header className="fixed inset-x-0 top-0 z-nav" style={{ height: "var(--nav-h)" }}>
      {/* legibility scrim */}
      <div
        className="pointer-events-none absolute inset-0 -bottom-8 bg-gradient-to-b from-ink/70 to-transparent"
        style={{ opacity: menuOpen ? 0 : 1, transition: "opacity 0.5s" }}
        aria-hidden
      />
      <div className="relative z-menu mx-auto flex h-full items-center justify-between px-6 md:px-10">
        <button
          type="button"
          onClick={() => scrollTo("top")}
          className="display text-lg tracking-[0.34em] text-bone transition-colors duration-500 hover:text-champagne"
          aria-label="CERAQO — back to top"
        >
          CERAQO<span className="align-super text-[0.5em] tracking-normal">™</span>
        </button>

        <button
          type="button"
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="fullscreen-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="group relative grid h-11 w-11 place-items-center"
        >
          <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
          <motion.span
            className="absolute block h-px w-7 bg-bone group-hover:bg-champagne"
            animate={menuOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
            transition={{ ease: EASE, duration: 0.6 }}
          />
          <motion.span
            className="absolute block h-px w-7 bg-bone group-hover:bg-champagne"
            animate={menuOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
            transition={{ ease: EASE, duration: 0.6 }}
          />
        </button>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useCinematic } from "@/lib/usePrefs";
import { useScrollTo } from "@/components/SmoothScroll";
import { CHAPTERS } from "@/lib/copy";

const R = 14;
const CIRC = 2 * Math.PI * R;

/**
 * Fixed right-hand chapter rail (desktop, cinematic mode only): chapter
 * number + label, one dot per chapter, and a small rotating ring around
 * the active dot whose stroke fills with that chapter's scroll progress.
 * Progress writes go straight to DOM refs from ScrollTrigger callbacks —
 * React state only changes when the *active chapter* changes.
 */
export default function ChapterRail() {
  const cinematic = useCinematic();
  const scrollTo = useScrollTo();
  const [active, setActive] = useState<string | null>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const activeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!cinematic) return;

    const triggers: ScrollTrigger[] = [];
    // Sections mount before the rail effect runs, so a direct query is safe.
    CHAPTERS.forEach((chapter) => {
      const el = document.getElementById(chapter.id);
      if (!el) return;
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 55%",
          end: "bottom 45%",
          onToggle: (self) => {
            if (self.isActive) {
              activeRef.current = chapter.id;
              setActive(chapter.id);
            } else if (activeRef.current === chapter.id && !self.isActive) {
              // Only clear if nothing else claimed the slot this frame.
              requestAnimationFrame(() => {
                if (activeRef.current === chapter.id && !self.isActive) {
                  activeRef.current = null;
                  setActive(null);
                }
              });
            }
          },
          onUpdate: (self) => {
            const ring = ringRef.current;
            if (ring && activeRef.current === chapter.id) {
              ring.style.strokeDashoffset = String(CIRC * (1 - self.progress));
            }
          },
        }),
      );
    });

    return () => triggers.forEach((t) => t.kill());
  }, [cinematic]);

  if (!cinematic) return null;

  const activeChapter = CHAPTERS.find((c) => c.id === active);

  return (
    <nav
      className="fixed right-7 top-1/2 z-nav hidden -translate-y-1/2 flex-col items-center gap-6 lg:flex"
      aria-label="Chapters"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? "auto" : "none",
        transition: "opacity 0.7s cubic-bezier(0.19,1,0.22,1)",
      }}
    >
      <span
        className="micro text-champagne"
        style={{ writingMode: "vertical-rl" }}
        aria-hidden
      >
        {activeChapter ? `${activeChapter.index} — ${activeChapter.label}` : ""}
      </span>

      <div className="flex flex-col items-center gap-4">
        {CHAPTERS.map((chapter) => {
          const isActive = chapter.id === active;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => scrollTo(chapter.id)}
              aria-label={`Go to chapter ${chapter.index}: ${chapter.title}`}
              aria-current={isActive ? "true" : undefined}
              className="relative grid h-9 w-9 place-items-center"
            >
              {isActive && (
                <svg className="cta-ring-spin absolute inset-0" viewBox="0 0 36 36" fill="none" aria-hidden>
                  <circle cx="18" cy="18" r={R} stroke="rgb(46 51 59)" strokeWidth="1" />
                  <circle
                    ref={ringRef}
                    cx="18"
                    cy="18"
                    r={R}
                    stroke="rgb(201 166 122)"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC}
                    transform="rotate(-90 18 18)"
                  />
                </svg>
              )}
              <span
                className={`block h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                  isActive ? "bg-champagne" : "bg-smoke hover:bg-steel"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

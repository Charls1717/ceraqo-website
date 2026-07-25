import { useEffect, useRef } from 'react';
import type Lenis from 'lenis';

/**
 * The dive's zone rail, continued: a fixed page index for the story
 * sections below. It stays hidden while the dive owns the screen (the
 * stage has its own rail) and on narrow viewports.
 */

export interface NavStop {
  id: string;
  num: string;
  label: string;
}

export default function SideNav({ stops }: { stops: NavStop[] }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLButtonElement>('.pagenav__item'));

    // Visible only once the dive track has left the viewport
    const dive = document.querySelector('.dive-track');
    let diveVisible = true;
    const vio = new IntersectionObserver(
      (entries) => {
        diveVisible = entries[0]?.isIntersecting ?? false;
        root.setAttribute('data-on', diveVisible ? 'false' : 'true');
      },
      { rootMargin: '-15% 0px -15% 0px' },
    );
    if (dive) vio.observe(dive);

    // Active stop tracking
    const sections = stops
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    const setActive = (id: string) => {
      items.forEach((el) => {
        el.setAttribute('data-active', el.dataset.target === id ? 'true' : 'false');
      });
    };
    const sio = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: [0, 0.2, 0.5] },
    );
    sections.forEach((el) => sio.observe(el));

    return () => {
      vio.disconnect();
      sio.disconnect();
    };
  }, [stops]);

  const jump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 8;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(top, { duration: 1.6 });
    else window.scrollTo(0, top);
  };

  return (
    <nav ref={rootRef} className="pagenav" data-on="false" aria-label="Page sections">
      {stops.map((s) => (
        <button
          key={s.id}
          type="button"
          className="pagenav__item"
          data-target={s.id}
          data-active="false"
          onClick={() => jump(s.id)}
          aria-label={`Go to ${s.label}`}
        >
          <span className="pagenav__num">{s.num}</span>
          <span className="pagenav__label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}

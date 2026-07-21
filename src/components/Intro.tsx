import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** The compromise-era prologue between the hero and the dive. */
export default function Intro() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%' },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="intro section" aria-label="Introduction">
      <p className="intro__lead reveal">
        For decades, protecting a vehicle has meant making compromises.
      </p>
      <div className="intro__pair">
        <p className="intro__big reveal">Waxes fade.</p>
        <p className="intro__big reveal">Sealants wear away.</p>
      </div>
      <p className="intro__body reveal">
        Professional coatings often require specialist skills, expensive equipment and
        complicated application procedures.
      </p>
      <p className="intro__turn reveal">Q-ARMOR changes everything.</p>
      <p className="intro__no reveal">
        No professional installer. No complicated process. No compromise.
      </p>
    </section>
  );
}

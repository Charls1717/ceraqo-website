import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Hero from './components/Hero';
import Opening from './components/Opening';
import Intro from './components/Intro';
import Dive from './components/Dive';
import Preloader from './components/Preloader';
import PostDive from './components/PostDive';
import { useDivePreload, type DiveTier } from './hooks/useDivePreload';
import './styles/site.css';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Pick the asset tier once per load: phones get the lighter videos;
  // displays that would show more than ~1920 physical pixels get the
  // 2560-wide rest stills (the videos stay 1080p — they only run in
  // motion, where upscaled video reads clean).
  const tier = useMemo<DiveTier>(
    () => (window.matchMedia('(max-width: 820px)').matches ? 'mobile' : 'desktop'),
    [],
  );
  const hidpiRests = useMemo(() => {
    if (window.matchMedia('(max-width: 820px)').matches) return false;
    return (window.devicePixelRatio || 1) * window.innerWidth > 1920;
  }, []);

  const { assets, progress, ready } = useDivePreload(tier, hidpiRests);
  const [started, setStarted] = useState(false);
  const diag = useMemo(() => new URLSearchParams(window.location.search).has('diag'), []);

  // Lenis smooth scroll, wired into GSAP's ticker
  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, duration: 1.05 });
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  // The loader's percentage is bound to exactly the bytes that gate
  // this flip, so the moment it reads 100% the page starts — the only
  // thing between the two is the loader's own fade-out.
  useEffect(() => {
    if (!ready || started) return;
    setStarted(true);
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.start();
    ScrollTrigger.refresh();
  }, [ready, started]);

  // Failsafe: never leave the page scroll-locked on a wedged fetch —
  // every consumer falls back to streaming network URLs.
  useEffect(() => {
    if (started) return;
    const t = window.setTimeout(() => {
      setStarted(true);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis?.start();
      ScrollTrigger.refresh();
    }, 12000);
    return () => window.clearTimeout(t);
  }, [started]);

  return (
    <>
      <Preloader progress={progress} done={started} />
      <Hero assets={assets} on={started} />
      <Opening />
      <Intro />
      <Dive assets={assets} active={started} />
      <PostDive />
      {diag && <Diag tier={tier} progress={progress} ready={ready} started={started} />}
    </>
  );
}

/** Tiny on-page readout for remote debugging: append ?diag to the URL. */
function Diag(props: { tier: string; progress: number; ready: boolean; started: boolean }) {
  const [line, setLine] = useState('');
  useEffect(() => {
    const read = () => {
      const d = window.__diveState;
      setLine(
        `scrollY ${Math.round(window.scrollY)} · state ${d?.state ?? '-'} ${d?.mode ?? ''}${
          d?.captured ? ' · captured' : ''
        }`,
      );
    };
    const i = window.setInterval(read, 300);
    return () => window.clearInterval(i);
  }, []);
  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 999,
        background: 'rgba(0,0,0,.82)',
        color: '#5ce9e4',
        font: '11px/1.5 monospace',
        padding: '8px 10px',
        pointerEvents: 'none',
        maxWidth: '90vw',
      }}
    >
      tier {props.tier} · load {Math.round(props.progress * 100)}% · ready {String(props.ready)} ·
      started {String(props.started)}
      <br />
      {line}
    </div>
  );
}

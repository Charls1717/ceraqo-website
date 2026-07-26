import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Dive from './components/Dive';
import SideNav from './components/SideNav';
import PreorderCta from './components/PreorderCta';
import Preloader from './components/Preloader';
import PostDive from './components/PostDive';
import { useFrameStore, type FrameProfile } from './hooks/useFrameLoader';
import './styles/site.css';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Pick the frame set once per load: phones get the lighter set, and
  // displays that would show more than ~1920 physical pixels of frame
  // (retina laptops, 4K monitors) get the high-DPI tier.
  const profile = useMemo<FrameProfile>(() => {
    if (window.matchMedia('(max-width: 820px)').matches) {
      // Portrait phones get the centre-cropped tier: full source height
      // where the landscape tier only had 810px to stretch across the
      // screen. Orientation is sampled once at load, like the profile.
      return window.matchMedia('(orientation: portrait)').matches ? 'mobilePortrait' : 'mobile';
    }
    const nav = navigator as Navigator & { deviceMemory?: number };
    const lowEnd =
      (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency || 8) <= 4;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const physical = (window.devicePixelRatio || 1) * window.innerWidth;
    return physical > 1920 && !lowEnd && !reduceMotion ? 'hidpi' : 'desktop';
  }, []);

  const { storeRef, progress, ready } = useFrameStore(profile, true);
  const [started, setStarted] = useState(false);
  const diag = useMemo(() => new URLSearchParams(window.location.search).has('diag'), []);

  // Lenis smooth scroll, wired into GSAP's ticker
  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.12, syncTouch: false });
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

  // Release the scroll the moment the opening frames are decoded — the
  // loader's percentage and this flip share one condition.
  useEffect(() => {
    if (!ready || started) return;
    setStarted(true);
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    lenis?.start();
    ScrollTrigger.refresh();
  }, [ready, started]);

  // Failsafe: the page must never stay scroll-locked, even if the frame
  // preload wedges on a flaky connection.
  useEffect(() => {
    if (started) return;
    const t = window.setTimeout(() => {
      setStarted(true);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis?.start();
      ScrollTrigger.refresh();
    }, 30000);
    return () => window.clearTimeout(t);
  }, [started]);

  return (
    <>
      <Preloader progress={progress} done={started} />
      <Dive storeRef={storeRef} profile={profile} active={started} />
      <PostDive />
      <SideNav
        stops={[
          { id: 's-protection', num: '01', label: 'Category' },
          { id: 's-specs', num: '02', label: 'Proof' },
          { id: 's-value', num: '03', label: 'Value' },
          { id: 's-preorder', num: '04', label: 'Pre-order' },
          { id: 's-contact', num: '05', label: 'Contact' },
        ]}
      />
      <PreorderCta on={started} />
      {diag && <Diag profile={profile} progress={progress} ready={ready} started={started} />}
    </>
  );
}

/** Tiny on-page readout for remote debugging: append ?diag to the URL. */
function Diag(props: { profile: string; progress: number; ready: boolean; started: boolean }) {
  const [line, setLine] = useState('');
  useEffect(() => {
    const read = () => {
      const s = window.__frameLoadState;
      setLine(
        `scrollY ${Math.round(window.scrollY)} · frames ${s ? `${s.loaded}/${s.total}` : '-'}`,
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
      profile {props.profile} · load {Math.round(props.progress * 100)}% · ready{' '}
      {String(props.ready)} · started {String(props.started)}
      <br />
      {line}
    </div>
  );
}

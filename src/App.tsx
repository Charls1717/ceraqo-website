import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Dive from './components/Dive';
import Preloader from './components/Preloader';
import PostDive from './components/PostDive';
import StillsFallback from './components/StillsFallback';
import { useFrameLoader } from './hooks/useFrameLoader';
import './styles/site.css';

gsap.registerPlugin(ScrollTrigger);

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (cb: () => void) => void;
  removeListener?: (cb: () => void) => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)') as LegacyMediaQueryList;
    const onChange = () => setReduced(mq.matches);
    // Older Safari only has addListener/removeListener
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener?.(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener?.(onChange);
    };
  }, []);
  return reduced;
}

function readFullOverride(): boolean {
  try {
    return sessionStorage.getItem('ceraqo-play-full') === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const prefersReduced = usePrefersReducedMotion();
  // Owners and curious visitors can opt out of the stills fallback
  const [playFull, setPlayFull] = useState(readFullOverride);
  const reducedMotion = prefersReduced && !playFull;

  // Pick the frame set once per load: phones get the lighter set.
  const profile = useMemo<'desktop' | 'mobile'>(
    () => (window.matchMedia('(max-width: 820px)').matches ? 'mobile' : 'desktop'),
    [],
  );

  const { imagesRef, progress, ready } = useFrameLoader(profile, !reducedMotion);
  const [started, setStarted] = useState(false);
  const diag = useMemo(() => new URLSearchParams(window.location.search).has('diag'), []);

  // Lenis smooth scroll, wired into GSAP's ticker
  useEffect(() => {
    if (reducedMotion) return;
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
  }, [reducedMotion]);

  // Release the scroll once frames are decoded
  useEffect(() => {
    if (!ready || started) return;
    const t = window.setTimeout(() => {
      setStarted(true);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis?.start();
      ScrollTrigger.refresh();
    }, 450);
    return () => window.clearTimeout(t);
  }, [ready, started]);

  // Failsafe: the page must never stay scroll-locked, even if the frame
  // preload wedges on a flaky connection.
  useEffect(() => {
    if (reducedMotion || started) return;
    const t = window.setTimeout(() => {
      setStarted(true);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis?.start();
      ScrollTrigger.refresh();
    }, 25000);
    return () => window.clearTimeout(t);
  }, [reducedMotion, started]);

  const enableFull = () => {
    try {
      sessionStorage.setItem('ceraqo-play-full', '1');
    } catch {
      /* opt-in still applies for this page view */
    }
    setPlayFull(true);
  };

  if (reducedMotion) {
    return (
      <>
        <StillsFallback onPlayFull={enableFull} />
        {diag && <Diag profile={profile} progress={0} ready={false} started={false} reduced />}
      </>
    );
  }

  return (
    <>
      <Preloader progress={progress} done={started} />
      <Dive imagesRef={imagesRef} profile={profile} active={started} />
      <PostDive />
      {diag && (
        <Diag profile={profile} progress={progress} ready={ready} started={started} reduced={false} />
      )}
    </>
  );
}

/** Tiny on-page readout for remote debugging: append ?diag to the URL. */
function Diag(props: {
  profile: string;
  progress: number;
  ready: boolean;
  started: boolean;
  reduced: boolean;
}) {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const read = () => setScroll(Math.round(window.scrollY));
    const i = window.setInterval(read, 400);
    window.addEventListener('scroll', read, { passive: true });
    return () => {
      window.clearInterval(i);
      window.removeEventListener('scroll', read);
    };
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
      ua: {navigator.userAgent.slice(0, 72)}
      <br />
      profile {props.profile} · reduced-motion {String(props.reduced)} · frames{' '}
      {Math.round(props.progress * 100)}% · ready {String(props.ready)} · started{' '}
      {String(props.started)}
      <br />
      scrollY {scroll} · sticky {CSS.supports('position', 'sticky') ? 'ok' : 'UNSUPPORTED'} · svh{' '}
      {CSS.supports('height', '100svh') ? 'ok' : 'no'}
    </div>
  );
}

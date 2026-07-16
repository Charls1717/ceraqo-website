import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import Dive from './components/Dive';
import Preloader from './components/Preloader';
import PostDive from './components/PostDive';
import { useFrameLoader } from './hooks/useFrameLoader';
import './styles/site.css';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Pick the frame set once per load: phones get the lighter set.
  const profile = useMemo<'desktop' | 'mobile'>(
    () => (window.matchMedia('(max-width: 820px)').matches ? 'mobile' : 'desktop'),
    [],
  );

  const { imagesRef, progress, ready } = useFrameLoader(profile, true);
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
    if (started) return;
    const t = window.setTimeout(() => {
      setStarted(true);
      const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
      lenis?.start();
      ScrollTrigger.refresh();
    }, 25000);
    return () => window.clearTimeout(t);
  }, [started]);

  return (
    <>
      <Preloader progress={progress} done={started} />
      <Dive imagesRef={imagesRef} profile={profile} active={started} />
      <PostDive />
      {diag && <Diag profile={profile} progress={progress} ready={ready} started={started} />}
    </>
  );
}

/** Tiny on-page readout for remote debugging: append ?diag to the URL. */
function Diag(props: { profile: string; progress: number; ready: boolean; started: boolean }) {
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
      profile {props.profile} · frames {Math.round(props.progress * 100)}% · ready{' '}
      {String(props.ready)} · started {String(props.started)}
      <br />
      scrollY {scroll} · sticky {CSS.supports('position', 'sticky') ? 'ok' : 'UNSUPPORTED'} · svh{' '}
      {CSS.supports('height', '100svh') ? 'ok' : 'no'}
    </div>
  );
}

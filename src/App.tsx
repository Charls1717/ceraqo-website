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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();

  // Pick the frame set once per load: phones get the lighter set.
  const profile = useMemo<'desktop' | 'mobile'>(
    () => (window.matchMedia('(max-width: 820px)').matches ? 'mobile' : 'desktop'),
    [],
  );

  const { imagesRef, progress, ready } = useFrameLoader(profile, !reducedMotion);
  const [started, setStarted] = useState(false);

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

  if (reducedMotion) {
    return <StillsFallback />;
  }

  return (
    <>
      <Preloader progress={progress} done={started} />
      <Dive imagesRef={imagesRef} profile={profile} active={started} />
      <PostDive />
    </>
  );
}

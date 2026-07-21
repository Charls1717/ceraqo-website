import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type Lenis from 'lenis';
import { ZONES, formatMagnification } from '../data/zones';
import type { DiveAssets } from '../hooks/useDivePreload';

/**
 * The snap dive. Five rest states (OBJECT, DROP, SPREAD, BOND, LATTICE),
 * each a static still. One scroll/swipe step forward plays one native
 * <video> transition once, hardware-decoded, and lands on the next rest.
 * One step backward cross-fades to the previous rest. A final step down
 * from LATTICE plays the exit clip (the pull-back out of the crystal,
 * full circle to the bottle) and releases the page into the content
 * below. There is no scroll-position-to-frame mapping anywhere.
 */

/** decades of magnification per forward step: 1x -> 1,000,000x over 4 */
const EXP_STEP = 1.5;
const REST_MAX = 4;
/** video index of the exit clip (LATTICE -> release) */
const EXIT = 4;
const BACK_FADE_S = 0.45;
const VIDEO_FADE_S = 0.2;
/** wheel delta that counts as one deliberate step */
const WHEEL_STEP = 70;
/** quiet time that separates two wheel gestures */
const WHEEL_GESTURE_GAP_MS = 320;
const TOUCH_STEP_PX = 52;

type Mode = 'rest' | 'video' | 'fade';

interface DiveProps {
  assets: DiveAssets;
  /** true once the preloader is done — arms capture and the HUD */
  active: boolean;
}

const getLenis = () => (window as unknown as { __lenis?: Lenis }).__lenis;

export default function Dive({ assets, active }: DiveProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgARef = useRef<HTMLImageElement>(null);
  const imgBRef = useRef<HTMLImageElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const magRef = useRef<HTMLDivElement>(null);
  const depthRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const zoneItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const section = sectionRef.current;
    const imgA = imgARef.current;
    const imgB = imgBRef.current;
    if (!section || !imgA || !imgB) return;
    const videos = videoRefs.current.filter((v): v is HTMLVideoElement => v !== null);
    if (videos.length !== 5) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- state ----------------------------------------------------
    let state = 0;
    let mode: Mode = 'rest';
    let captured = false;
    let queued = false;
    let currentVideo = -1;
    let frontImg = imgA;
    let backImg = imgB;
    let cooldownUntil = 0;
    let watchdog = 0;
    let disposed = false;
    /** the exit clip's final bottle frame is on screen (post-release) */
    let exitShown = false;

    const publish = () => {
      window.__diveState = { state, mode, captured, queued };
    };
    publish();

    // ---- HUD ------------------------------------------------------
    const hud = { exp: 0 };
    let hudFrom = 0;
    let hudTo = 0;
    let lastMagText = '';
    const renderHud = () => {
      const magText = formatMagnification(Math.pow(10, hud.exp));
      if (magText !== lastMagText && magRef.current) {
        magRef.current.textContent = magText;
        lastMagText = magText;
      }
      if (depthRef.current) {
        depthRef.current.textContent = `DEPTH ${((hud.exp / 6) * 1.2).toFixed(2)} µm`;
      }
    };
    renderHud();

    const hudTick = () => {
      if (mode !== 'video' || currentVideo < 0) return;
      const v = videos[currentVideo];
      const d = v.duration || assets.duration(currentVideo);
      if (!d || Number.isNaN(d)) return;
      const frac = Math.min(1, Math.max(0, v.currentTime / d));
      hud.exp = hudFrom + (hudTo - hudFrom) * frac;
      renderHud();
    };
    gsap.ticker.add(hudTick);

    // ---- overlays -------------------------------------------------
    const showOverlay = (i: number) => {
      const el = overlayRefs.current[i];
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { opacity: 0, y: 14, visibility: 'visible' },
        { opacity: 1, y: 0, duration: 0.55, delay: 0.22, ease: 'power2.out' },
      );
    };
    const hideOverlay = (i: number) => {
      const el = overlayRefs.current[i];
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.to(el, {
        opacity: 0,
        duration: 0.24,
        ease: 'power1.in',
        onComplete: () => gsap.set(el, { visibility: 'hidden' }),
      });
    };
    const setHint = (on: boolean) => {
      const el = hintRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.to(el, { opacity: on ? 1 : 0, duration: 0.35, delay: on ? 0.5 : 0 });
    };
    const setRail = () => {
      zoneItemRefs.current.forEach((el, i) => {
        el?.setAttribute('data-active', i === state ? 'true' : 'false');
      });
    };

    // ---- media layers --------------------------------------------
    const hideOtherVideos = (keep: number) => {
      videos.forEach((v, i) => {
        if (i !== keep) {
          gsap.set(v, { opacity: 0, zIndex: 2 });
          if (!v.paused) v.pause();
        }
      });
    };

    const arrive = (j: number) => {
      window.clearTimeout(watchdog);
      const from = state;
      state = j;
      mode = 'rest';
      currentVideo = -1;
      hud.exp = EXP_STEP * j;
      renderHud();
      // Prime the still underneath the frozen final video frame — it is
      // pixel-matched to the frame the next transition starts from.
      frontImg.src = assets.restSrc(j);
      gsap.set(frontImg, { opacity: 1, zIndex: 1 });
      if (from !== j) hideOverlay(from);
      showOverlay(j);
      setHint(true);
      setRail();
      publish();
      if (queued && state < REST_MAX) {
        queued = false;
        window.setTimeout(() => {
          if (!disposed && captured && mode === 'rest') step(1);
        }, 260);
      } else {
        queued = false;
        publish();
      }
    };

    /** Fallback arrival for when a video refuses to play (rare). */
    const arriveByFade = (j: number) => {
      window.clearTimeout(watchdog);
      mode = 'rest';
      currentVideo = -1;
      fadeToState(j, BACK_FADE_S);
    };

    const playForward = (k: number) => {
      const v = videos[k];
      mode = 'video';
      currentVideo = k;
      exitShown = false;
      hudFrom = k === EXIT ? 6 : EXP_STEP * k;
      hudTo = k === EXIT ? 0 : EXP_STEP * (k + 1);
      hideOverlay(state);
      setHint(false);
      publish();

      const src = assets.videoSrc(k);
      if (v.dataset.src !== src) {
        v.preload = 'auto';
        v.src = src;
        v.dataset.src = src;
        v.load();
      }
      try {
        v.currentTime = 0;
      } catch {
        /* metadata not there yet — it starts at 0 anyway */
      }
      v.addEventListener(
        'playing',
        () => {
          if (disposed || currentVideo !== k) return;
          gsap.set(v, { zIndex: 3, visibility: 'visible' });
          gsap.to(v, {
            opacity: 1,
            duration: VIDEO_FADE_S,
            ease: 'none',
            onComplete: () => {
              if (disposed || currentVideo !== k) return;
              hideOtherVideos(k);
              gsap.set(v, { zIndex: 2 });
            },
          });
        },
        { once: true },
      );
      const played = v.play();
      played?.catch(() => {
        if (!disposed && currentVideo === k) {
          if (k === EXIT) exitComplete();
          else arriveByFade(k + 1);
        }
      });
      window.clearTimeout(watchdog);
      watchdog = window.setTimeout(
        () => {
          if (!disposed && mode === 'video' && currentVideo === k) {
            if (k === EXIT) exitComplete();
            else arriveByFade(k + 1);
          }
        },
        (assets.duration(k) + 10) * 1000,
      );
    };

    const fadeToState = (j: number, dur: number) => {
      mode = 'fade';
      const from = state;
      hideOverlay(from);
      setHint(false);
      publish();
      backImg.src = assets.restSrc(j);
      const go = () => {
        if (disposed) return;
        gsap.set(backImg, { zIndex: 4, opacity: 0, visibility: 'visible' });
        gsap.to(hud, {
          exp: EXP_STEP * j,
          duration: dur,
          ease: 'power1.inOut',
          onUpdate: renderHud,
        });
        gsap.to(backImg, {
          opacity: 1,
          duration: dur,
          ease: 'power1.inOut',
          onComplete: () => {
            if (disposed) return;
            hideOtherVideos(-1);
            gsap.set(frontImg, { opacity: 0, zIndex: 1 });
            gsap.set(backImg, { zIndex: 1 });
            const tmp = frontImg;
            frontImg = backImg;
            backImg = tmp;
            state = j;
            mode = 'rest';
            hud.exp = EXP_STEP * j;
            renderHud();
            showOverlay(j);
            setHint(true);
            setRail();
            publish();
          },
        });
      };
      backImg.decode().then(go, go);
    };

    // ---- capture / release ---------------------------------------
    const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;

    const release = (dir: 1 | -1) => {
      captured = false;
      publish();
      detachInput();
      const lenis = getLenis();
      const top = sectionTop();
      const vh = window.innerHeight;
      cooldownUntil = performance.now() + 1400;
      lenis?.start();
      const target = dir > 0 ? top + vh * 0.998 : Math.max(0, top - vh * 0.92);
      lenis?.scrollTo(target, { duration: 1.15, lock: true });
    };

    const exitComplete = () => {
      window.clearTimeout(watchdog);
      mode = 'rest';
      currentVideo = -1;
      queued = false;
      exitShown = true;
      hud.exp = 0;
      renderHud();
      publish();
      release(1);
    };

    const step = (dir: 1 | -1) => {
      if (mode === 'video') {
        if (dir > 0 && currentVideo < EXIT) queued = true;
        publish();
        return;
      }
      if (mode === 'fade') return;
      if (dir > 0) {
        if (state >= REST_MAX) {
          // The exit shot: out of the lattice, full circle to the
          // bottle, then the page continues.
          if (reduceMotion) exitComplete();
          else playForward(EXIT);
          return;
        }
        if (reduceMotion) fadeToState(state + 1, BACK_FADE_S);
        else playForward(state);
      } else {
        if (state <= 0) {
          release(-1);
          return;
        }
        fadeToState(state - 1, BACK_FADE_S);
      }
    };

    // ---- input ----------------------------------------------------
    let wheelArmed = true;
    let wheelAccum = 0;
    let lastWheelT = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = performance.now();
      const dy =
        e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (mode !== 'rest') {
        lastWheelT = now;
        wheelArmed = false;
        if (dy > 0) step(1); // records the queued step
        return;
      }
      if (!wheelArmed) {
        // Trailing momentum from the gesture that triggered the last
        // step — swallow it until the input goes quiet.
        if (now - lastWheelT <= WHEEL_GESTURE_GAP_MS) {
          lastWheelT = now;
          return;
        }
        wheelArmed = true;
        wheelAccum = 0;
      }
      if ((dy > 0 && wheelAccum < 0) || (dy < 0 && wheelAccum > 0)) wheelAccum = 0;
      if (now - lastWheelT > WHEEL_GESTURE_GAP_MS) wheelAccum = 0;
      lastWheelT = now;
      wheelAccum += dy;
      if (Math.abs(wheelAccum) >= WHEEL_STEP) {
        const dir: 1 | -1 = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;
        wheelArmed = false;
        step(dir);
      }
    };

    let touchStartY: number | null = null;
    let touchUsed = false;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? null;
      touchUsed = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchStartY === null || touchUsed) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const dy = touchStartY - y;
      if (Math.abs(dy) >= TOUCH_STEP_PX) {
        touchUsed = true;
        step(dy > 0 ? 1 : -1);
      }
    };
    const onTouchEnd = () => {
      touchStartY = null;
      touchUsed = false;
    };

    let lastKeyT = 0;
    const onKey = (e: KeyboardEvent) => {
      const down = ['ArrowDown', 'PageDown', ' '].includes(e.key);
      const up = ['ArrowUp', 'PageUp'].includes(e.key);
      if (!down && !up) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastKeyT < 380) return;
      lastKeyT = now;
      step(down ? 1 : -1);
    };

    const attachInput = () => {
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd, { passive: true });
      window.addEventListener('keydown', onKey);
    };
    const detachInput = () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKey);
    };

    const capture = () => {
      if (captured || disposed) return;
      captured = true;
      publish();
      const lenis = getLenis();
      lenis?.stop();
      lenis?.scrollTo(sectionTop(), { duration: 0.4, force: true, lock: true });
      attachInput();
      wheelArmed = false; // swallow the gesture that carried us in
      lastWheelT = performance.now();
      if (exitShown) {
        // Re-entering from below: the exit clip's bottle frame is up —
        // restore the LATTICE rest it releases from.
        exitShown = false;
        fadeToState(REST_MAX, 0.55);
      } else {
        setHint(true);
      }
    };

    // A section-fill check: the dive owns the viewport when its box
    // covers the middle band of the screen.
    const inZone = () => {
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      return r.top < vh * 0.45 && r.bottom > vh * 0.55;
    };

    const maybeCapture = (velocity: number) => {
      if (captured || disposed || !activeRef.current) return;
      if (performance.now() < cooldownUntil) return;
      if (Math.abs(velocity) > 90) return; // let deliberate flings pass
      if (inZone()) capture();
    };

    const onLenisScroll = (e: { velocity: number }) => maybeCapture(e.velocity);
    // Child effects run before App's Lenis effect on mount — bind on the
    // next frame(s), once the instance exists.
    let boundLenis: Lenis | undefined;
    const bindLenis = () => {
      if (disposed) return;
      boundLenis = getLenis();
      if (boundLenis) boundLenis.on('scroll', onLenisScroll);
      else requestAnimationFrame(bindLenis);
    };
    bindLenis();

    // Input that begins inside the zone captures immediately, so a
    // visitor who parked the dive mid-screen is picked up on their
    // first wheel tick / touch instead of scrolling past it.
    const onAnyWheel = (e: WheelEvent) => {
      if (!captured && activeRef.current && performance.now() >= cooldownUntil && inZone()) {
        capture();
        e.preventDefault();
      }
    };
    const onAnyTouchStart = () => {
      if (!captured && activeRef.current && performance.now() >= cooldownUntil && inZone()) {
        capture();
      }
    };
    window.addEventListener('wheel', onAnyWheel, { passive: false });
    window.addEventListener('touchstart', onAnyTouchStart, { passive: true });

    const onResize = () => {
      if (captured) {
        getLenis()?.scrollTo(sectionTop(), { immediate: true, force: true });
      }
    };
    window.addEventListener('resize', onResize);

    // ---- video ended wiring --------------------------------------
    const endedHandlers = videos.map((v, k) => {
      const h = () => {
        if (disposed || mode !== 'video' || currentVideo !== k) return;
        if (k === EXIT) exitComplete();
        else arrive(k + 1);
      };
      v.addEventListener('ended', h);
      return h;
    });

    // ---- rail -----------------------------------------------------
    const railJump = (i: number) => {
      if (!activeRef.current || mode !== 'rest' || i === state) return;
      if (!captured) capture();
      fadeToState(i, 0.55);
    };
    (section as HTMLElement & { __railJump?: (i: number) => void }).__railJump = railJump;

    return () => {
      disposed = true;
      window.clearTimeout(watchdog);
      detachInput();
      window.removeEventListener('wheel', onAnyWheel);
      window.removeEventListener('touchstart', onAnyTouchStart);
      window.removeEventListener('resize', onResize);
      boundLenis?.off('scroll', onLenisScroll);
      gsap.ticker.remove(hudTick);
      videos.forEach((v, k) => v.removeEventListener('ended', endedHandlers[k]));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  // Activation after the loader clears: show the OBJECT rest.
  useEffect(() => {
    if (!active) return;
    const img = imgARef.current;
    if (img && !img.src) {
      img.src = assets.restSrc(0);
      gsap.set(img, { opacity: 1, zIndex: 1 });
      const el = overlayRefs.current[0];
      if (el) {
        gsap.fromTo(
          el,
          { opacity: 0, y: 14, visibility: 'visible' },
          { opacity: 1, y: 0, duration: 0.55, delay: 0.4, ease: 'power2.out' },
        );
      }
    }
  }, [active, assets]);

  return (
    <section ref={sectionRef} className="dive" aria-label="The Q-ARMOR dive" id="dive">
      <div className="dive-stage">
        <div className="dive-media-stack" aria-hidden="true">
          <img ref={imgARef} className="dive-media" alt="" draggable={false} />
          <img ref={imgBRef} className="dive-media" alt="" draggable={false} />
          {[0, 1, 2, 3, 4].map((i) => (
            <video
              key={i}
              ref={(el) => {
                videoRefs.current[i] = el;
              }}
              className="dive-media dive-video"
              muted
              playsInline
              preload="none"
              disablePictureInPicture
              tabIndex={-1}
            />
          ))}
        </div>
        <div className="dive-grade" />
        <div className="dive-vignette" />
        <div className="dive-grain" />
        <div className="finder" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        <div ref={hintRef} className="overlay overlay--hint" style={{ opacity: 0 }}>
          <span className="micro">Scroll to descend</span>
          <span className="overlay__hint-line" />
        </div>

        {/* Zone facts — one per rest state */}
        {ZONES.map((zone, i) => (
          <div
            key={zone.id}
            ref={(el) => {
              overlayRefs.current[i] = el;
            }}
            className="overlay overlay--zone"
            style={{ opacity: 0, visibility: 'hidden' }}
          >
            <div className="overlay__kicker">
              Zone 0{i + 1} — {zone.kicker}
            </div>
            <p className="overlay__fact">{zone.fact}</p>
            <div className="overlay__meta">
              <span className="overlay__index">
                {String(i + 1).padStart(2, '0')} / {String(ZONES.length).padStart(2, '0')}
              </span>
              <span className="overlay__meta-rule" />
            </div>
          </div>
        ))}

        {/* HUD */}
        <div className="hud" data-on={active ? 'true' : 'false'}>
          <div className="hud__corner hud__corner--tl">
            <div className="hud__brand wordmark">
              CERAQO <span style={{ color: 'var(--c-cyan)' }}>/</span> Q-ARMOR
            </div>
            <div className="hud__sub">Surface dive — five depths</div>
          </div>

          <div className="hud__corner hud__corner--bl">
            <div className="hud__mag-label">Magnification</div>
            <div ref={magRef} className="hud__mag">
              1.0×
            </div>
          </div>

          <div className="hud__corner hud__corner--br">
            <div ref={depthRef} className="hud__depth">
              DEPTH 0.00 µm
            </div>
            <div className="hud__sub">covalent interface scan</div>
          </div>

          <div className="hud__rail">
            {ZONES.map((zone, i) => (
              <button
                key={zone.id}
                type="button"
                ref={(el) => {
                  zoneItemRefs.current[i] = el;
                }}
                className="hud__zone"
                data-active={i === 0 ? 'true' : 'false'}
                aria-label={`Go to zone ${i + 1} — ${zone.kicker}`}
                onClick={() => {
                  const s = sectionRef.current as
                    | (HTMLElement & { __railJump?: (i: number) => void })
                    | null;
                  s?.__railJump?.(i);
                }}
              >
                <span className="hud__zone-num">0{i + 1}</span>
                {zone.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

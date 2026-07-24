"use client";

import { useEffect, useRef, useState } from "react";
import { useCinematic } from "@/lib/usePrefs";
import type { VideoAsset } from "@/lib/media";

interface Props {
  video: VideoAsset;
  /** Extra classes on the wrapper (position/size it from the outside). */
  className?: string;
  /** 0–1 multiplier dark overlay to keep type legible. */
  dim?: number;
  /** Force the still even on capable devices (e.g. decorative slots). */
  stillOnly?: boolean;
  /**
   * Stage control: a chapter marks only the on-stage scene active so a
   * sticky stack never decodes more than one video at a time.
   */
  active?: boolean;
}

/**
 * Full-bleed ambient loop with a seamless join.
 *
 * Generated clips can't be trimmed to a mathematically perfect loop
 * without a video pipeline, so two buffers play the same file and
 * crossfade near the tail: A approaches its end → B starts from 0 and
 * fades in over ~0.9s → roles swap. The cut disappears into the fade.
 *
 * Fallback ladder: cinematic devices get the dual-buffer loop; coarse
 * pointers and prefers-reduced-motion get the poster still; a missing
 * poster leaves the flat ink ground. Playback pauses whenever the
 * element leaves the viewport.
 */
export default function AmbientVideo({
  video,
  className = "",
  dim = 0,
  stillOnly = false,
  active = true,
}: Props) {
  const cinematic = useCinematic();
  const wrapRef = useRef<HTMLDivElement>(null);
  const aRef = useRef<HTMLVideoElement>(null);
  const bRef = useRef<HTMLVideoElement>(null);
  // Which buffer is currently the audible/visible "front" one.
  const frontRef = useRef<"a" | "b">("a");
  const [failed, setFailed] = useState(false);

  const showVideo = cinematic && !stillOnly && !failed;

  useEffect(() => {
    if (!showVideo) return;
    const a = aRef.current;
    const b = bRef.current;
    const wrap = wrapRef.current;
    if (!a || !b || !wrap) return;

    const FADE = 0.9; // seconds of overlap
    let inView = false;
    let raf = 0;

    const front = () => (frontRef.current === "a" ? a : b);
    const back = () => (frontRef.current === "a" ? b : a);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const f = front();
      const g = back();
      if (!f.duration || Number.isNaN(f.duration)) return;
      const remain = f.duration - f.currentTime;
      if (remain <= FADE) {
        // Ramp the back buffer in as the front runs out.
        if (g.paused) {
          g.currentTime = 0;
          void g.play().catch(() => {});
        }
        const k = 1 - Math.max(0, remain / FADE);
        g.style.opacity = String(k);
        if (remain <= 0.05) {
          // Swap roles; old front rests at opacity 0 until its turn.
          f.pause();
          f.style.opacity = "0";
          g.style.opacity = "1";
          frontRef.current = frontRef.current === "a" ? "b" : "a";
        }
      }
    };

    const play = () => {
      const f = front();
      f.style.opacity = "1";
      void f.play().catch(() => setFailed(true));
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      cancelAnimationFrame(raf);
      a.pause();
      b.pause();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && active && !document.hidden) play();
        else pause();
      },
      { threshold: 0.12 },
    );
    io.observe(wrap);

    const onVis = () => (document.hidden || !inView || !active ? pause() : play());
    document.addEventListener("visibilitychange", onVis);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      pause();
    };
  }, [showVideo, active]);

  return (
    <div ref={wrapRef} className={`overflow-hidden bg-ink ${className}`} aria-hidden>
      {/* Poster ground is always painted first — video fades in over it. */}
      {video.poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={video.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      {showVideo && (
        <>
          <video
            ref={aRef}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
            src={video.mp4}
            muted
            playsInline
            preload="metadata"
            onError={() => setFailed(true)}
          />
          <video
            ref={bRef}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0 }}
            src={video.mp4}
            muted
            playsInline
            preload="metadata"
          />
        </>
      )}
      {dim > 0 && (
        <div
          className="absolute inset-0"
          style={{ background: `rgb(10 11 12 / ${dim})` }}
        />
      )}
    </div>
  );
}

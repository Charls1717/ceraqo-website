import { useEffect, useRef, useState } from "react";
import type { FrameSet } from "./manifest";

export function frameUrl(set: FrameSet, i: number): string {
  return `${set.basePath}/f${String(i + 1).padStart(4, "0")}.${set.ext}`;
}

/**
 * Progressive loader for a scroll-scrubbed frame sequence.
 * Pass 1 loads every 8th frame so the whole timeline is scrubbable fast;
 * pass 2 fills in the rest front-to-back. `nearest` returns the closest
 * decoded frame so scrubbing never blocks on the network.
 */
export function useFrameSequence(set: FrameSet | null) {
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const flags = useRef<Uint8Array>(new Uint8Array(0));
  const [coarseReady, setCoarseReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!set || set.count <= 0) return;
    let alive = true;
    imgs.current = new Array<HTMLImageElement | null>(set.count).fill(null);
    flags.current = new Uint8Array(set.count);
    setLoadedCount(0);
    setTotal(set.count);
    setCoarseReady(false);

    const STEP = 8;
    const seen = new Set<number>();
    const queue: number[] = [];
    const push = (i: number) => {
      if (i >= 0 && i < set.count && !seen.has(i)) {
        seen.add(i);
        queue.push(i);
      }
    };
    for (let i = 0; i < set.count; i += STEP) push(i);
    push(set.count - 1);
    const coarseTarget = queue.length;
    for (let i = 0; i < set.count; i++) push(i);

    let cursor = 0;
    let inFlight = 0;
    let done = 0;
    let coarseDone = 0;
    const CONCURRENCY = 6;

    const startLoad = (idx: number) => {
      inFlight++;
      const im = new Image();
      im.decoding = "async";
      const fin = (ok: boolean) => {
        inFlight--;
        if (!alive) return;
        if (ok) {
          imgs.current[idx] = im;
          flags.current[idx] = 1;
          done++;
          coarseDone++;
          if (coarseDone === coarseTarget) setCoarseReady(true);
          if (done % 8 === 0 || done === set.count) setLoadedCount(done);
        }
        pump();
      };
      im.onload = () => fin(true);
      im.onerror = () => fin(false);
      im.src = frameUrl(set, idx);
    };

    const pump = () => {
      if (!alive) return;
      while (inFlight < CONCURRENCY && cursor < queue.length) startLoad(queue[cursor++]);
    };
    pump();

    return () => {
      alive = false;
      imgs.current = [];
      flags.current = new Uint8Array(0);
    };
  }, [set]);

  const nearest = (target: number): HTMLImageElement | null => {
    const arr = imgs.current;
    const f = flags.current;
    const n = arr.length;
    if (!n) return null;
    const t = Math.max(0, Math.min(n - 1, Math.round(target)));
    if (f[t]) return arr[t];
    for (let d = 1; d < n; d++) {
      const lo = t - d;
      const hi = t + d;
      if (lo >= 0 && f[lo]) return arr[lo];
      if (hi < n && f[hi]) return arr[hi];
    }
    return null;
  };

  return { nearest, coarseReady, loadedCount, total };
}

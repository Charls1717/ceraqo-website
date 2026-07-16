import { useEffect, useRef, useState } from 'react';
import manifest from '../data/frame-manifest.json';
import { assetUrl } from '../lib/assetUrl';

export interface FrameSetInfo {
  dir: string;
  width: number;
  height: number;
  count: number;
}

export interface ZoneRange {
  id: string;
  /** first global frame index of the zone (0-based, inclusive) */
  start: number;
  /** last global frame index of the zone (0-based, inclusive) */
  end: number;
}

export interface FrameManifest {
  desktop: FrameSetInfo;
  mobile: FrameSetInfo;
  zones: ZoneRange[];
}

export const FRAME_MANIFEST = manifest as unknown as FrameManifest;

export function frameUrl(dir: string, index: number): string {
  return assetUrl(`${dir}/f${String(index + 1).padStart(4, '0')}.webp`);
}

const CONCURRENCY = 10;

declare global {
  interface Window {
    /** loading telemetry, also used by the QA suite */
    __frameLoadState?: { loaded: number; total: number };
  }
}

/**
 * Preloads the frame sequence for the given profile in two phases:
 * the loader blocks only until the first zone (plus a spill margin) is
 * decoded, then the page opens while the rest streams in scroll order.
 * Images land in a stable ref array so consumers can draw without
 * re-rendering.
 */
export function useFrameLoader(profile: 'desktop' | 'mobile', enabled: boolean) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const imagesRef = useRef<(HTMLImageElement | undefined)[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const info = FRAME_MANIFEST[profile];
    const count = info.count;
    const images: (HTMLImageElement | undefined)[] = new Array(count);
    imagesRef.current = images;
    window.__frameLoadState = { loaded: 0, total: count };

    if (count === 0) {
      setProgress(1);
      setReady(true);
      return;
    }

    // Block the loader on the OBJECT zone plus a spill into DROP; the
    // rest streams in while the visitor is still at the top.
    const firstZoneEnd = FRAME_MANIFEST.zones[0]?.end ?? count - 1;
    const blockUntil = Math.min(count, firstZoneEnd + 33);

    let loaded = 0;
    let cursor = 0;
    let readyFired = false;

    const loadOne = (index: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        const done = () => {
          images[index] = img;
          resolve();
        };
        img.onload = done;
        // A dropped frame should never wedge the loader; the canvas
        // falls back to the nearest loaded neighbour.
        img.onerror = () => resolve();
        img.src = frameUrl(info.dir, index);
      });

    const bump = () => {
      loaded++;
      if (window.__frameLoadState) window.__frameLoadState.loaded = loaded;
      if (!readyFired) {
        if (loaded === blockUntil || loaded % 4 === 0) {
          setProgress(Math.min(1, loaded / blockUntil));
        }
        if (loaded >= blockUntil) {
          readyFired = true;
          setProgress(1);
          setReady(true);
        }
      }
    };

    const worker = async () => {
      while (!cancelled) {
        const index = cursor++;
        if (index >= count) return;
        await loadOne(index);
        bump();
      }
    };

    Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
      if (!cancelled && !readyFired) {
        setProgress(1);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [profile, enabled]);

  return { imagesRef, progress, ready };
}

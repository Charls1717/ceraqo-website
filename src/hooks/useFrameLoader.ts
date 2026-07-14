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

/**
 * Preloads the full frame sequence for the given profile, reporting
 * progress in [0, 1]. Images land in a stable ref array so consumers
 * can draw without re-rendering.
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

    if (count === 0) {
      setProgress(1);
      setReady(true);
      return;
    }

    let loaded = 0;
    let cursor = 0;

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

    const worker = async () => {
      while (!cancelled) {
        const index = cursor++;
        if (index >= count) return;
        await loadOne(index);
        loaded++;
        if (loaded === count || loaded % 5 === 0) {
          setProgress(loaded / count);
        }
      }
    };

    Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(() => {
      if (!cancelled) {
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

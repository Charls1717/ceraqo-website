import { useEffect, useRef, useState } from 'react';
import manifest from '../data/frame-manifest.json';
import { assetUrl } from '../lib/assetUrl';
import { FrameStore } from '../lib/frameStore';

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
  hidpi: FrameSetInfo;
  mobile: FrameSetInfo;
  zones: ZoneRange[];
}

export type FrameProfile = 'desktop' | 'hidpi' | 'mobile';

export const FRAME_MANIFEST = manifest as unknown as FrameManifest;

export function frameUrl(dir: string, index: number): string {
  return assetUrl(`${dir}/f${String(index + 1).padStart(4, '0')}.webp`);
}

declare global {
  interface Window {
    /** loading telemetry, also used by the QA suite */
    __frameLoadState?: { loaded: number; total: number };
  }
}

/**
 * Streams the frame sequence for the given profile through the decode
 * worker (see lib/frameStore). The loader blocks only until the OBJECT
 * zone is fetched and the opening bitmaps are decoded; everything else
 * streams in scroll order while the visitor is still at the top.
 */
export function useFrameStore(profile: FrameProfile, enabled: boolean) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const storeRef = useRef<FrameStore | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const info = FRAME_MANIFEST[profile];
    const store = new FrameStore(info);
    storeRef.current = store;
    window.__frameLoadState = { loaded: 0, total: info.count };

    const firstZoneEnd = FRAME_MANIFEST.zones[0]?.end ?? info.count - 1;
    const blockUntil = Math.min(info.count, firstZoneEnd + 33);
    let readyFired = false;

    store.onProgress = (loaded, total) => {
      window.__frameLoadState = { loaded, total };
      if (readyFired) return;
      setProgress(Math.min(1, loaded / blockUntil));
      if (loaded >= blockUntil && store.get(0)) {
        readyFired = true;
        setProgress(1);
        setReady(true);
      }
    };
    // Aim the decode window at the top of the dive immediately
    store.request(0, 1);

    return () => {
      store.destroy();
      storeRef.current = null;
    };
  }, [profile, enabled]);

  return { storeRef, progress, ready };
}

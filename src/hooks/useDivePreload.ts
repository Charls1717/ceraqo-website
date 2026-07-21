import { useEffect, useRef, useState } from 'react';
import manifest from '../data/dive-manifest.json';
import { assetUrl } from '../lib/assetUrl';

export interface EncodedSource {
  src: string;
  bytes: number;
}
export interface TransitionInfo {
  mp4: EncodedSource;
  webm: EncodedSource;
  duration: number;
}
export interface RestInfo {
  src: string;
  bytes: number;
}
export interface DiveTierInfo {
  width: number;
  height: number;
  transitions: TransitionInfo[];
  rests: RestInfo[];
}
export interface DiveManifest {
  desktop: DiveTierInfo;
  mobile: DiveTierInfo;
  hidpiRests: RestInfo[];
}

export type DiveTier = 'desktop' | 'mobile';

export const DIVE_MANIFEST = manifest as unknown as DiveManifest;

declare global {
  interface Window {
    /** loading + snap-state telemetry, also read by the QA suite */
    __divePreload?: {
      progress: number;
      ready: boolean;
      videosReady: boolean[];
      restsReady: boolean[];
    };
    __diveState?: {
      state: number;
      mode: 'rest' | 'video' | 'fade';
      captured: boolean;
      queued: boolean;
    };
  }
}

/**
 * Everything the dive needs, resolved to the best URL currently
 * available: a blob URL once the asset has been fully fetched (playback
 * can never stall), else the network URL (progressive fallback).
 */
export class DiveAssets {
  readonly tier: DiveTier;
  readonly info: DiveTierInfo;
  /**
   * Container format picked once per load: H.264/MP4 wherever it plays
   * (universal hardware decode, Safari included), else VP9/WebM
   * (open-codec Chromium builds).
   */
  readonly format: 'mp4' | 'webm';
  private readonly restInfos: RestInfo[];
  private videoBlobs: (string | null)[] = [null, null, null, null, null];
  private restBlobs: (string | null)[] = [null, null, null, null, null];
  /** notified whenever a background asset lands */
  onUpdate: (() => void) | null = null;

  constructor(tier: DiveTier, hidpiRests: boolean) {
    this.tier = tier;
    this.info = DIVE_MANIFEST[tier];
    this.restInfos = hidpiRests ? DIVE_MANIFEST.hidpiRests : this.info.rests;
    const probe = document.createElement('video');
    const mp4Ok = probe.canPlayType('video/mp4; codecs="avc1.64002A"') !== '';
    const webmOk = probe.canPlayType('video/webm; codecs="vp9"') !== '';
    this.format = mp4Ok || !webmOk ? 'mp4' : 'webm';
  }

  videoInfo(i: number): EncodedSource {
    return this.info.transitions[i][this.format];
  }
  videoSrc(i: number): string {
    return this.videoBlobs[i] ?? assetUrl(this.videoInfo(i).src);
  }
  restSrc(i: number): string {
    return this.restBlobs[i] ?? assetUrl(this.restInfos[i].src);
  }
  videoReady(i: number): boolean {
    return this.videoBlobs[i] !== null;
  }
  duration(i: number): number {
    return this.info.transitions[i].duration;
  }

  private publish() {
    const t = window.__divePreload;
    if (t) {
      t.videosReady = this.videoBlobs.map((b) => b !== null);
      t.restsReady = this.restBlobs.map((b) => b !== null);
    }
    this.onUpdate?.();
  }
  setVideoBlob(i: number, url: string) {
    this.videoBlobs[i] = url;
    this.publish();
  }
  setRestBlob(i: number, url: string) {
    this.restBlobs[i] = url;
    this.publish();
  }
  restBytes(i: number): number {
    return this.restInfos[i].bytes;
  }
  restNetworkSrc(i: number): string {
    return assetUrl(this.restInfos[i].src);
  }
}

/** Fetch a URL to a blob URL, reporting byte progress along the way. */
async function fetchTracked(
  url: string,
  expectedBytes: number,
  onBytes: (loaded: number) => void,
): Promise<string> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`fetch failed: ${url}`);
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onBytes(Math.min(loaded, expectedBytes));
  }
  onBytes(expectedBytes);
  const blob = new Blob(chunks as BlobPart[]);
  return URL.createObjectURL(blob);
}

/**
 * Two-phase preload for the snap dive.
 *
 * Blocking (what the loader percentage measures, byte for byte): the
 * OBJECT rest still + the Object→Drop transition video. `ready` fires
 * the moment those bytes are on the machine — the percentage and the
 * dismissal condition are the same quantity, so 100% IS interactive.
 *
 * Background (after reveal, during natural dwell time): the remaining
 * rest stills, then transitions 2–5, fetched one at a time so the
 * pipe is never contended while a transition might be requested.
 */
export function useDivePreload(tier: DiveTier, hidpiRests: boolean) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const assetsRef = useRef<DiveAssets | null>(null);
  if (assetsRef.current === null) {
    assetsRef.current = new DiveAssets(tier, hidpiRests);
  }

  useEffect(() => {
    const assets = assetsRef.current!;
    const restTotal = assets.restBytes(0);
    const videoInfo = assets.videoInfo(0);
    const total = restTotal + videoInfo.bytes;
    let restLoaded = 0;
    let videoLoaded = 0;
    let cancelled = false;

    window.__divePreload = {
      progress: 0,
      ready: false,
      videosReady: [false, false, false, false, false],
      restsReady: [false, false, false, false, false],
    };

    const report = () => {
      const p = Math.min(1, (restLoaded + videoLoaded) / total);
      setProgress(p);
      if (window.__divePreload) window.__divePreload.progress = p;
    };

    const blocking = Promise.all([
      fetchTracked(assets.restNetworkSrc(0), restTotal, (n) => {
        restLoaded = n;
        report();
      }).then((url) => {
        if (!cancelled) assets.setRestBlob(0, url);
      }),
      fetchTracked(assetUrl(videoInfo.src), videoInfo.bytes, (n) => {
        videoLoaded = n;
        report();
      }).then((url) => {
        if (!cancelled) assets.setVideoBlob(0, url);
      }),
    ]);

    blocking
      .then(() => {
        if (cancelled) return;
        setReady(true);
        if (window.__divePreload) window.__divePreload.ready = true;
        void backgroundQueue(assets, () => cancelled);
      })
      .catch(() => {
        // Blocking fetch failed (offline blip, dev server restart):
        // reveal anyway — every consumer falls back to network URLs.
        if (cancelled) return;
        setProgress(1);
        setReady(true);
        if (window.__divePreload) window.__divePreload.ready = true;
      });

    return () => {
      cancelled = true;
    };
    // The tier is decided once per page load before first render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { assets: assetsRef.current, progress, ready };
}

/** Sequential low-priority fetch of everything not needed for reveal. */
async function backgroundQueue(assets: DiveAssets, isCancelled: () => boolean) {
  const idle = () =>
    new Promise<void>((res) => {
      const ric = window.requestIdleCallback?.bind(window);
      if (ric) ric(() => res(), { timeout: 1500 });
      else window.setTimeout(() => res(), 250);
    });

  // Rest stills first — they are small and the backward cross-fade
  // needs them; then the four remaining transition videos in order.
  for (let i = 1; i <= 4; i++) {
    if (isCancelled()) return;
    await idle();
    try {
      const url = await fetchTracked(assets.restNetworkSrc(i), assets.restBytes(i), () => {});
      if (!isCancelled()) assets.setRestBlob(i, url);
    } catch {
      /* stays on the network URL */
    }
  }
  for (let i = 1; i <= 4; i++) {
    if (isCancelled()) return;
    await idle();
    try {
      const info = assets.videoInfo(i);
      const url = await fetchTracked(assetUrl(info.src), info.bytes, () => {});
      if (!isCancelled()) assets.setVideoBlob(i, url);
    } catch {
      /* stays on the network URL — the <video> will stream it */
    }
  }
}

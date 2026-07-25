import { frameUrl, type FrameSetInfo } from '../hooks/useFrameLoader';

/**
 * Sliding-window ImageBitmap cache in front of the decode worker.
 *
 * The profile that motivated this: with plain Image() drawing, Chrome
 * evicted decoded frames under memory pressure and re-decoded 2560px
 * WebPs synchronously inside drawImage — ~50ms of main-thread stall per
 * frame, 30.5s of decode in a 30s scroll. Here the worker decodes off
 * the main thread and only a bounded window of bitmaps stays resident.
 */

/**
 * The window is SYMMETRIC around the cursor on purpose: Lenis produces
 * tiny direction reversals at every gesture end, and a direction-biased
 * window turned each of those into a mass evict + re-decode cycle. The
 * screen-recording signature of that bug was the canvas re-drawing a
 * stale neighbour every ~0.3s while the worker churned.
 */
const RADIUS = 14;
const EVICT_SLACK = 6;

export class FrameStore {
  readonly total: number;
  readonly bitmaps = new Map<number, ImageBitmap>();
  loaded = 0;
  onProgress?: (loaded: number, total: number) => void;

  private worker: Worker;
  private pending = new Set<number>();
  private lastCenter = -1;
  private lastDir: 1 | -1 = 1;

  constructor(info: FrameSetInfo, resizeWidth?: number) {
    this.total = info.count;
    const urls = Array.from({ length: info.count }, (_, i) => frameUrl(info.dir, i));
    this.worker = new Worker(new URL('./frameWorker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (e) => {
      const m = e.data as
        | { type: 'progress'; loaded: number; total: number }
        | { type: 'bitmap'; index: number; bitmap: ImageBitmap }
        | { type: 'bitmapfail'; index: number };
      if (m.type === 'progress') {
        this.loaded = m.loaded;
        this.onProgress?.(m.loaded, m.total);
        // Blobs that arrived after a 'need' was queued get re-requested
        if (this.lastCenter >= 0) this.request(this.lastCenter, this.lastDir, true);
      } else if (m.type === 'bitmap') {
        this.pending.delete(m.index);
        if (this.inWindow(m.index) && !this.bitmaps.has(m.index)) {
          this.bitmaps.set(m.index, m.bitmap);
          // Re-notify so ready-gating that waits on decoded bitmaps re-evaluates
          this.onProgress?.(this.loaded, this.total);
        } else {
          m.bitmap.close();
        }
      } else {
        this.pending.delete(m.index);
      }
    };
    this.worker.postMessage({
      type: 'init',
      urls,
      resizeWidth: resizeWidth && resizeWidth < info.width ? resizeWidth : undefined,
    });
  }

  private windowBounds(center: number): [number, number] {
    return [Math.max(0, center - RADIUS), Math.min(this.total - 1, center + RADIUS)];
  }

  private inWindow(i: number): boolean {
    if (this.lastCenter < 0) return true;
    const [lo, hi] = this.windowBounds(this.lastCenter);
    return i >= lo - EVICT_SLACK && i <= hi + EVICT_SLACK;
  }

  /** Aim the decode window; evicts bitmaps that fell out of it. */
  request(center: number, dir: 1 | -1, gentle = false) {
    this.lastCenter = center;
    this.lastDir = dir;
    const [lo, hi] = this.windowBounds(center);

    if (!gentle) {
      for (const [k, bmp] of this.bitmaps) {
        if (k < lo - EVICT_SLACK || k > hi + EVICT_SLACK) {
          bmp.close();
          this.bitmaps.delete(k);
          this.pending.delete(k);
        }
      }
    }

    // Priority: the target first, then outward — leaning one step extra
    // in the travel direction per ring so catch-up favours where the
    // cursor is heading without ever churning on a direction flip.
    const want: number[] = [];
    for (let d = 0; d <= RADIUS; d++) {
      const a = center + d * dir;
      const b = center - d * dir;
      if (a >= lo && a <= hi) want.push(a);
      if (d > 0 && b >= lo && b <= hi) want.push(b);
    }
    // Gentle refreshes (fired on fetch progress) repost everything
    // non-resident: the pending set only reflects what we ASKED for,
    // not what the worker could actually decode at the time.
    const need = want.filter(
      (i) =>
        i >= 0 && i < this.total && !this.bitmaps.has(i) && (gentle || !this.pending.has(i)),
    );
    if (need.length) {
      need.forEach((i) => this.pending.add(i));
      this.worker.postMessage({ type: 'need', indices: need });
    }
  }

  /** Exact bitmap, or the nearest resident neighbour. */
  nearest(index: number): ImageBitmap | undefined {
    const hit = this.bitmaps.get(index);
    if (hit) return hit;
    for (let d = 1; d < this.total; d++) {
      const lo = this.bitmaps.get(index - d);
      if (lo) return lo;
      const hi = this.bitmaps.get(index + d);
      if (hi) return hi;
    }
    return undefined;
  }

  get(index: number): ImageBitmap | undefined {
    return this.bitmaps.get(index);
  }

  destroy() {
    this.worker.terminate();
    for (const bmp of this.bitmaps.values()) bmp.close();
    this.bitmaps.clear();
  }
}

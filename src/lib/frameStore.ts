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

const AHEAD = 20;
const BEHIND = 8;
const EVICT_SLACK = 4;

export class FrameStore {
  readonly total: number;
  readonly bitmaps = new Map<number, ImageBitmap>();
  loaded = 0;
  onProgress?: (loaded: number, total: number) => void;

  private worker: Worker;
  private pending = new Set<number>();
  private lastCenter = -1;
  private lastDir: 1 | -1 = 1;

  constructor(info: FrameSetInfo) {
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
        if (this.inWindow(m.index)) {
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
    this.worker.postMessage({ type: 'init', urls });
  }

  private windowBounds(center: number, dir: 1 | -1): [number, number] {
    const ahead = dir === 1 ? AHEAD : BEHIND;
    const behind = dir === 1 ? BEHIND : AHEAD;
    return [Math.max(0, center - behind), Math.min(this.total - 1, center + ahead)];
  }

  private inWindow(i: number): boolean {
    if (this.lastCenter < 0) return true;
    const [lo, hi] = this.windowBounds(this.lastCenter, this.lastDir);
    return i >= lo - EVICT_SLACK && i <= hi + EVICT_SLACK;
  }

  /** Aim the decode window; evicts bitmaps that fell out of it. */
  request(center: number, dir: 1 | -1, gentle = false) {
    this.lastCenter = center;
    this.lastDir = dir;
    const [lo, hi] = this.windowBounds(center, dir);

    if (!gentle) {
      for (const [k, bmp] of this.bitmaps) {
        if (k < lo - EVICT_SLACK || k > hi + EVICT_SLACK) {
          bmp.close();
          this.bitmaps.delete(k);
          this.pending.delete(k);
        }
      }
    }

    // Priority: the target itself, then ahead in scroll direction, then behind
    const want: number[] = [];
    for (let d = 0; d <= AHEAD; d++) {
      const i = center + d * dir;
      if (i >= lo && i <= hi) want.push(i);
    }
    for (let d = 1; d <= BEHIND; d++) {
      const i = center - d * dir;
      if (i >= lo && i <= hi) want.push(i);
    }
    const need = want.filter(
      (i) => i >= 0 && i < this.total && !this.bitmaps.has(i) && !this.pending.has(i),
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

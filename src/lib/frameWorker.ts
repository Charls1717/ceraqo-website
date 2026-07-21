/// <reference lib="webworker" />
/**
 * Frame decode worker. Owns the compressed WebP bytes and turns them into
 * ImageBitmaps off the main thread on demand. The main thread never
 * decodes an image again — it only blits transferred bitmaps.
 */

interface InitMsg {
  type: 'init';
  urls: string[];
  /** decode straight to display size: smaller residents, 1:1 blits */
  resizeWidth?: number;
}
interface NeedMsg {
  type: 'need';
  /** frame indices in decode-priority order */
  indices: number[];
}
type InMsg = InitMsg | NeedMsg;

const blobs: (Blob | undefined)[] = [];
let queue: number[] = [];
let resizeWidth: number | undefined;

const post = (msg: unknown, transfer?: Transferable[]) =>
  (self as unknown as Worker).postMessage(msg, transfer ?? []);

async function fetchAll(urls: string[]) {
  let loaded = 0;
  let cursor = 0;
  const CONCURRENCY = 8;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const i = cursor++;
        if (i >= urls.length) return;
        try {
          const res = await fetch(urls[i]);
          blobs[i] = await res.blob();
        } catch {
          /* dropped frame: the renderer falls back to a neighbour */
        }
        loaded++;
        post({ type: 'progress', loaded, total: urls.length });
        pump();
      }
    }),
  );
}

/**
 * Decode with a few parallel lanes — createImageBitmap runs on the
 * browser's thread pool, so concurrent decodes use multiple cores and
 * catch-up throughput beats any realistic scrub speed. The queue is
 * still replaced wholesale by each 'need', so priority stays fresh.
 */
const LANES = 3;
let active = 0;

function pump() {
  while (active < LANES && queue.length) {
    const i = queue.shift()!;
    const blob = blobs[i];
    if (!blob) continue; // not fetched yet; main will re-request
    active++;
    const done = () => {
      active--;
      pump();
    };
    const opts = resizeWidth
      ? { resizeWidth, resizeQuality: 'high' as const }
      : undefined;
    createImageBitmap(blob, opts as ImageBitmapOptions)
      .then((bitmap) => {
        post({ type: 'bitmap', index: i, bitmap }, [bitmap]);
        done();
      })
      .catch(() => {
        post({ type: 'bitmapfail', index: i });
        done();
      });
  }
}

self.onmessage = (e: MessageEvent<InMsg>) => {
  const m = e.data;
  if (m.type === 'init') {
    resizeWidth = m.resizeWidth;
    void fetchAll(m.urls);
  } else if (m.type === 'need') {
    // Newest request defines priority: replace, don't append.
    queue = m.indices.slice();
    void pump();
  }
};

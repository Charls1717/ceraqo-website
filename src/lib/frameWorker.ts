/// <reference lib="webworker" />
/**
 * Frame decode worker. Owns the compressed WebP bytes and turns them into
 * ImageBitmaps off the main thread on demand. The main thread never
 * decodes an image again — it only blits transferred bitmaps.
 */

interface InitMsg {
  type: 'init';
  urls: string[];
}
interface NeedMsg {
  type: 'need';
  /** frame indices in decode-priority order */
  indices: number[];
}
type InMsg = InitMsg | NeedMsg;

const blobs: (Blob | undefined)[] = [];
let queue: number[] = [];
let decoding = false;

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

/** Decode one queued frame at a time so 'need' reprioritisation wins. */
async function pump() {
  if (decoding) return;
  decoding = true;
  while (queue.length) {
    const i = queue.shift()!;
    const blob = blobs[i];
    if (!blob) continue; // not fetched yet; main will re-request
    try {
      const bitmap = await createImageBitmap(blob);
      post({ type: 'bitmap', index: i, bitmap }, [bitmap]);
    } catch {
      post({ type: 'bitmapfail', index: i });
    }
  }
  decoding = false;
}

self.onmessage = (e: MessageEvent<InMsg>) => {
  const m = e.data;
  if (m.type === 'init') {
    void fetchAll(m.urls);
  } else if (m.type === 'need') {
    // Newest request defines priority: replace, don't append.
    queue = m.indices.slice();
    void pump();
  }
};

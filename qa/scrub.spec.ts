import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Manifest {
  desktop: { count: number };
  zones: { id: string; start: number; end: number }[];
}

const manifest: Manifest = JSON.parse(
  readFileSync(join(__dirname, '../src/data/frame-manifest.json'), 'utf-8'),
);

const ZONE_LABELS = ['OBJECT', 'DROP', 'SPREAD', 'BOND', 'LATTICE'];

/**
 * Expected HUD readouts at the five proof stops (log scale 1 -> 1e6).
 * The endpoints are clamped and asserted exactly; the mid stops get a
 * tolerance because a single scroll pixel shifts 10^(6p) measurably.
 */
const STOPS: { p: number; mag: number; exact?: string }[] = [
  { p: 0.0, mag: 1, exact: '1.0×' },
  { p: 0.25, mag: 31.6 },
  { p: 0.5, mag: 1_000 },
  { p: 0.75, mag: 31_623 },
  { p: 1.0, mag: 1_000_000, exact: '1,000,000×' },
];

async function waitForStart(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.loader[data-done="true"]', { timeout: 120_000 });
  // Give the fade-out and first draw a beat
  await page.waitForTimeout(700);
}

/** Scroll so the dive scrub sits at progress p in [0, 1]. */
async function scrubTo(page: Page, p: number) {
  await page.evaluate((progress) => {
    const track = document.querySelector<HTMLElement>('.dive-track')!;
    const max = track.offsetTop + track.offsetHeight - window.innerHeight;
    window.scrollTo(0, Math.round(progress * max));
  }, p);
  // Two rAFs for ScrollTrigger + canvas, then settle
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
  await page.waitForTimeout(350);
}

async function canvasPixels(page: Page): Promise<{ data: number[]; w: number; h: number }> {
  return page.evaluate(() => {
    const canvas = document.querySelector<HTMLCanvasElement>('.dive-canvas')!;
    const sample = document.createElement('canvas');
    const w = 64;
    const h = 36;
    sample.width = w;
    sample.height = h;
    const ctx = sample.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    return { data: Array.from(img.data), w, h };
  });
}

function meanAbsDiff(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    sum += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
  }
  return sum / ((a.length / 4) * 3);
}

test('dive scrub: HUD counts through every zone and proof screenshots land', async ({ page }) => {
  await waitForStart(page);

  for (const stop of STOPS) {
    await scrubTo(page, stop.p);
    const magText = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
    if (stop.exact) {
      expect(magText).toBe(stop.exact);
    } else {
      const value = Number(magText.replace(/[×,]/g, ''));
      expect(value, `HUD read ${magText} at ${stop.p * 100}%`).toBeGreaterThan(stop.mag * 0.94);
      expect(value, `HUD read ${magText} at ${stop.p * 100}%`).toBeLessThan(stop.mag * 1.06);
    }
    const pct = String(Math.round(stop.p * 100)).padStart(3, '0');
    await page.screenshot({ path: `qa/scrub-${pct}.png` });
  }

  // Zone labels activate mid-zone
  const denom = manifest.desktop.count - 1;
  for (let i = 0; i < manifest.zones.length; i++) {
    const z = manifest.zones[i];
    const mid = (z.start + z.end) / 2 / denom;
    await scrubTo(page, mid);
    const active = await page.locator('.hud__zone[data-active="true"]').textContent();
    expect(active?.trim()).toBe(ZONE_LABELS[i]);
  }
});

test('dive scrub: no visible seam at any clip boundary', async ({ page }) => {
  await waitForStart(page);

  const denom = manifest.desktop.count - 1;
  for (let i = 0; i < manifest.zones.length - 1; i++) {
    const lastOfClip = manifest.zones[i].end / denom;
    const firstOfNext = manifest.zones[i + 1].start / denom;

    await scrubTo(page, lastOfClip);
    const before = await canvasPixels(page);
    await scrubTo(page, firstOfNext);
    const after = await canvasPixels(page);

    const diff = meanAbsDiff(before.data, after.data);
    // Chained clips share the exact frame at the boundary; allow a
    // whisker of codec noise but fail on any visible jump.
    expect(
      diff,
      `seam between clip ${i + 1} and clip ${i + 2} (mean abs channel diff ${diff.toFixed(2)})`,
    ).toBeLessThan(8);
  }
});

test('post-dive: specs, launch line and waitlist render', async ({ page }) => {
  await waitForStart(page);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(900);
  await expect(page.getByText('9H heat-cured / 8H ambient-cured')).toBeVisible();
  await expect(page.getByText(/One bottle\. One car\./)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join the Waitlist' })).toBeVisible();
  await page.screenshot({ path: 'qa/post-sections.png', fullPage: false });
});

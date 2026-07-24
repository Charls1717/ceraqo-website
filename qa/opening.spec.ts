import { expect, test, type Page } from '@playwright/test';

/**
 * QA for "The Opening" — the scroll-scrubbed WebGL bridge.
 * The timeline must be a pure function of scroll position (reversible),
 * reduced-motion must get the static poster, and the snap dive below
 * must stay reachable.
 */

declare global {
  interface Window {
    __openingState?: { t: number; mode: 'webgl' | 'poster' };
  }
}

async function waitLoaderDone(page: Page) {
  await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 90_000 });
  await page.waitForTimeout(500);
}

interface OpeningInfo {
  top: number;
  span: number;
}

async function openingInfo(page: Page): Promise<OpeningInfo> {
  return page.evaluate(() => {
    const s = document.querySelector<HTMLElement>('.opening')!;
    return {
      top: s.getBoundingClientRect().top + window.scrollY,
      span: s.offsetHeight - window.innerHeight,
    };
  });
}

const seek = (page: Page, info: OpeningInfo, f: number) =>
  page.evaluate(
    ([y]) =>
      (
        window as unknown as {
          __lenis: { scrollTo: (t: number, o: object) => void };
        }
      ).__lenis.scrollTo(y, { immediate: true, force: true }),
    [info.top + info.span * f],
  );

/** 64x36 luma sample of the WebGL canvas, for frame comparisons */
const sample = (page: Page) =>
  page.evaluate(() => {
    const src = document.querySelector<HTMLCanvasElement>('.opening-canvas')!;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 36;
    const g = c.getContext('2d')!;
    g.drawImage(src, 0, 0, 64, 36);
    const d = g.getImageData(0, 0, 64, 36).data;
    const out: number[] = [];
    for (let i = 0; i < d.length; i += 4) {
      out.push(Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]));
    }
    return out;
  });

const meanAbsDiff = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;

test.describe('the opening (step 2)', () => {
  test('scroll scrubs the timeline and the scene actually changes', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    const info = await openingInfo(page);
    await seek(page, info, 0.05);
    await page.waitForTimeout(600);
    const st = await page.evaluate(() => window.__openingState);
    expect(st?.mode).toBe('webgl');
    const early = await sample(page);
    await seek(page, info, 0.5);
    await page.waitForTimeout(600);
    const mid = await page.evaluate(() => window.__openingState);
    expect(mid?.t).toBeGreaterThan(0.45);
    expect(mid?.t).toBeLessThan(0.55);
    const midShot = await sample(page);
    expect(meanAbsDiff(early, midShot)).toBeGreaterThan(4);
    await seek(page, info, 0.95);
    await page.waitForTimeout(600);
    const late = await sample(page);
    expect(meanAbsDiff(midShot, late)).toBeGreaterThan(4);
    await page.screenshot({ path: 'qa/opening-late.png' });
  });

  test('scrubbing back re-renders the exact earlier frame (reversible)', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    const info = await openingInfo(page);
    await seek(page, info, 0.34);
    await page.waitForTimeout(650);
    const first = await sample(page);
    await seek(page, info, 0.85);
    await page.waitForTimeout(650);
    await seek(page, info, 0.34);
    await page.waitForTimeout(650);
    const again = await sample(page);
    const diff = meanAbsDiff(first, again);
    console.log(`reversibility mean-abs-diff: ${diff.toFixed(3)}`);
    expect(diff).toBeLessThan(1.2);
  });

  test('reduced motion gets the static poster, no WebGL scene', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitLoaderDone(page);
    await expect(page.locator('.opening-poster')).toBeAttached();
    const st = await page.evaluate(() => window.__openingState);
    expect(st?.mode).toBe('poster');
    const h = await page.evaluate(() => {
      const s = document.querySelector<HTMLElement>('.opening')!;
      return s.offsetHeight / window.innerHeight;
    });
    expect(h).toBeLessThan(1.2); // no tall scrub track in poster mode
    await ctx.close();
  });

  test('the dive below is still reachable and captures', async ({ page }) => {
    await page.goto('/');
    await waitLoaderDone(page);
    for (let i = 0; i < 70; i++) {
      await page.mouse.wheel(0, 340);
      await page.waitForTimeout(90);
      const captured = await page.evaluate(() => window.__diveState?.captured ?? false);
      if (captured) break;
    }
    await page.waitForFunction(() => window.__diveState?.captured === true, undefined, {
      timeout: 10_000,
    });
    await page.waitForFunction(() => window.__diveState?.mode === 'rest', undefined, {
      timeout: 10_000,
    });
  });
});

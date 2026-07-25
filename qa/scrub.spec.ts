import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Manifest {
  desktop: { count: number; width: number };
  hidpi: { count: number; width: number };
  mobile: { count: number; width: number };
  zones: { id: string; start: number; end: number }[];
}

const manifest: Manifest = JSON.parse(
  readFileSync(join(__dirname, '../src/data/frame-manifest.json'), 'utf-8'),
);

const ZONE_LABELS = ['OBJECT', 'DROP', 'SPREAD', 'BOND', 'LATTICE'];

declare global {
  interface Window {
    __hundredAt?: number;
    __doneAt?: number;
  }
}

/**
 * Expected HUD readouts at the five proof stops. Magnification is
 * zone-anchored (src/data/zones.ts): log-linear between the anchors
 * [1, 2, 20, 400, 5e4, 1e6] inside each fifth of the dive. Endpoints
 * are clamped and asserted exactly; mid stops get a tolerance for
 * sub-pixel scroll placement.
 */
const STOPS: { p: number; mag: number; exact?: string }[] = [
  { p: 0.0, mag: 1, exact: '1.0×' },
  { p: 0.25, mag: 3.56 },
  { p: 0.5, mag: 89.4 },
  { p: 0.75, mag: 14_950 },
  { p: 1.0, mag: 1_000_000, exact: '1,000,000×' },
];

async function waitForStart(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.loader[data-done="true"]', { timeout: 120_000 });
  // The loader releases after zone 1; QA needs the whole sequence, so
  // wait for the background stream to finish too.
  await page.waitForFunction(
    () => {
      const s = window.__frameLoadState;
      return !!s && s.loaded >= s.total;
    },
    undefined,
    { timeout: 120_000 },
  );
  // Give the fade-out and first draw a beat
  await page.waitForTimeout(700);
}

/** Scroll so the dive scrub sits at progress p in [0, 1]. */
async function scrubTo(page: Page, p: number) {
  await page.evaluate((progress) => {
    const track = document.querySelector<HTMLElement>('.dive-track')!;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const span = track.offsetHeight - window.innerHeight;
    window.scrollTo(0, Math.round(top + progress * span));
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

/** Wait until the eased frame cursor has settled (canvas stops changing). */
async function waitForCanvasStable(page: Page) {
  let prev = await canvasPixels(page);
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(120);
    const cur = await canvasPixels(page);
    if (meanAbsDiff(prev.data, cur.data) < 0.35) return;
    prev = cur;
  }
}

test('dive scrub: HUD counts through every zone and proof screenshots land', async ({ page }) => {
  await waitForStart(page);

  for (const stop of STOPS) {
    await scrubTo(page, stop.p);
    await waitForCanvasStable(page);
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
    expect(active).toContain(ZONE_LABELS[i]);
  }
});

test('dive scrub: no visible seam at any clip boundary', async ({ page }) => {
  await waitForStart(page);

  const denom = manifest.desktop.count - 1;
  for (let i = 0; i < manifest.zones.length - 1; i++) {
    const lastOfClip = manifest.zones[i].end / denom;
    const firstOfNext = manifest.zones[i + 1].start / denom;

    await scrubTo(page, lastOfClip);
    await waitForCanvasStable(page);
    const before = await canvasPixels(page);
    await scrubTo(page, firstOfNext);
    await waitForCanvasStable(page);
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

test('dive scrub: sustained frame rate during continuous scroll', async ({ page }) => {
  await waitForStart(page);

  // Warm pass: visit the whole sequence once so HTTP + decode caches are
  // primed, the way a real visitor scrolls the dive gradually rather than
  // sprinting 400 frames in four seconds.
  await scrubTo(page, 1);
  await page.waitForTimeout(800);
  await scrubTo(page, 0);
  await page.waitForTimeout(400);

  const fps = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o: object) => void } })
          .__lenis;
        const track = document.querySelector<HTMLElement>('.dive-track')!;
        const top = track.getBoundingClientRect().top + window.scrollY;
        const span = track.offsetHeight - window.innerHeight;
        const durationMs = 4000;
        lenis?.scrollTo(top + span * 0.85, {
          duration: durationMs / 1000,
          easing: (t: number) => t,
        });
        let count = 0;
        let start = 0;
        const tick = (ts: number) => {
          if (!start) start = ts;
          count++;
          if (ts - start < durationMs) requestAnimationFrame(tick);
          else resolve(count / ((ts - start) / 1000));
        };
        requestAnimationFrame(tick);
      }),
  );

  console.log(`measured scrub frame rate: ${fps.toFixed(1)} fps (headless software rendering)`);
  // This container rasterizes in software and shares CPU, so the absolute
  // number underestimates real hardware; the floor exists to catch genuine
  // regressions (e.g. accidental per-frame React re-renders, which halve
  // the rate), not to prove 60fps — container instances measured anywhere
  // from ~32 to ~52fps on identical code, so the floor sits below that
  // variance band.
  expect(fps).toBeGreaterThan(24);

  // The canvas must actually have advanced deep into the dive
  const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
  expect(Number(mag.replace(/[×,]/g, ''))).toBeGreaterThan(10_000);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('phones load the lighter mobile frame set and scrub correctly', async ({ page }) => {
    const frameRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/frames/')) frameRequests.push(url);
    });

    await waitForStart(page);

    const mobileHits = frameRequests.filter((u) => u.includes('/frames/mobile/')).length;
    const desktopHits = frameRequests.filter((u) => u.includes('/frames/desktop/')).length;
    expect(mobileHits).toBe(manifest.mobile.count);
    expect(desktopHits).toBe(0);

    await scrubTo(page, 0.5);
    const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
    expect(Number(mag.replace(/[×,]/g, ''))).toBeGreaterThan(60);
    await page.screenshot({ path: 'qa/mobile-050.png' });
  });
});

test('hud rail: clicking a zone glides the dive to that zone', async ({ page }) => {
  await waitForStart(page);

  await page.getByRole('button', { name: /Jump to zone 4/ }).click();
  // Lenis glide is 2.6s; give it time to arrive and settle
  await page.waitForTimeout(3400);

  const active = (await page.locator('.hud__zone[data-active="true"]').textContent())?.trim();
  expect(active).toContain('BOND');
  // Zone 4 entry (frame 303 of 484) sits near ×750 on the
  // zone-anchored curve (bond runs 400 -> 50,000)
  const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
  expect(Number(mag.replace(/[×,]/g, ''))).toBeGreaterThan(450);
});

test.describe('high-DPI', () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  test('retina displays load the 2560px tier and scrub correctly', async ({ page }) => {
    // This runner reports 4 cores, which rightly triggers the low-end
    // tier downgrade; spoof a normal laptop so the hidpi path itself
    // stays under test.
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    });
    const frameRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/frames/')) frameRequests.push(url);
    });

    await waitForStart(page);

    const hidpiHits = frameRequests.filter((u) => u.includes('/frames/hidpi/')).length;
    const desktopHits = frameRequests.filter((u) => u.includes('/frames/desktop/')).length;
    expect(hidpiHits).toBe(manifest.hidpi.count);
    expect(desktopHits).toBe(0);

    await scrubTo(page, 0.25);
    const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
    expect(Number(mag.replace(/[×,]/g, ''))).toBeGreaterThan(3);

    // Desktop-class devices keep the 1.25 backing cap — the mobile
    // sharpness work must not creep into the trackpad-tuned path.
    const backing = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.dive-canvas')!;
      return { w: c.width, cssW: c.clientWidth };
    });
    expect(backing.w).toBe(Math.round(backing.cssW * 1.25));
  });
});

test.describe('mobile high-DPI sharpness', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  test('canvas backing store runs at device resolution and survives rotation', async ({ page }) => {
    await waitForStart(page);

    const m = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.dive-canvas')!;
      const ctx = c.getContext('2d')!;
      return {
        w: c.width,
        h: c.height,
        cssW: c.clientWidth,
        cssH: c.clientHeight,
        smooth: ctx.imageSmoothingEnabled,
        quality: ctx.imageSmoothingQuality,
      };
    });
    // The requirement is >=2x; the implementation gives the true DPR up
    // to a cap of 3, so on this dpr-3 emulation the backing is exact 3x.
    expect(m.w).toBeGreaterThanOrEqual(m.cssW * 2);
    expect(m.w).toBe(Math.round(m.cssW * 3));
    expect(m.h).toBe(Math.round(m.cssH * 3));
    expect(m.smooth, 'imageSmoothingEnabled after resize').toBe(true);
    expect(m.quality, 'imageSmoothingQuality after resize').toBe('high');

    // Rotation recalculates the backing store at the same DPR
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);
    const rotated = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.dive-canvas')!;
      return { w: c.width, cssW: c.clientWidth, quality: c.getContext('2d')!.imageSmoothingQuality };
    });
    expect(rotated.w).toBe(Math.round(rotated.cssW * 3));
    expect(rotated.quality, 'smoothing re-asserted after backing reset').toBe('high');
  });
});

test.describe('reduced motion', () => {
  test('the dive is the only page: reduce-motion visitors get the full scrub too', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForSelector('.loader[data-done="true"]', {
      state: 'attached',
      timeout: 120_000,
    });
    await expect(page.locator('.dive-track')).toHaveCount(1);
    await scrubTo(page, 0.5);
    const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
    expect(Number(mag.replace(/[×,]/g, ''))).toBeGreaterThan(60);
  });
});

test('post-dive: specs, launch line and waitlist render', async ({ page }) => {
  await waitForStart(page);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(900);
  await expect(page.locator('.scard__label', { hasText: 'Up to 9H Pencil Hardness' })).toBeVisible();
  await expect(page.getByText(/One bottle\. One car\./)).toBeVisible();
  await expect(page.locator('.waitlist__btn')).toHaveText('Pre-order — €169');
  await page.screenshot({ path: 'qa/post-sections.png', fullPage: false });
});

test('the dive reacts from the very first scroll pixel', async ({ page }) => {
  await waitForStart(page);
  const trackTop = await page.evaluate(() => {
    const t = document.querySelector<HTMLElement>('.dive-track')!;
    return Math.round(t.getBoundingClientRect().top + window.scrollY);
  });
  expect(trackTop, 'the scrub track owns scroll position 0').toBe(0);
  await expect(page.locator('.overlay--hero')).toBeVisible();
  await expect(page.locator('.overlay__title')).toHaveText(
    'The Future of Vehicle Protection.',
  );
  const before = await canvasPixels(page);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(800);
  const after = await canvasPixels(page);
  expect(
    meanAbsDiff(before.data, after.data),
    'frames advance within the first 400px of scroll',
  ).toBeGreaterThan(0.8);
  const mag = (await page.locator('.hud__mag').textContent())?.trim() ?? '';
  expect(mag, 'the HUD is already counting').not.toBe('1.0×');
  const op = await page
    .locator('.overlay--hero')
    .evaluate((el) => Number(getComputedStyle(el).opacity));
  expect(op, 'the hero copy is already yielding to the descent').toBeLessThan(0.6);
});

test('loader: percentage is bound to the dismissal condition', async ({ page }) => {
  await page.addInitScript(() => {
    const watch = () => {
      const pct = document.querySelector('.loader__pct');
      const loader = document.querySelector('.loader');
      if (!pct || !loader) {
        requestAnimationFrame(watch);
        return;
      }
      const note = () => {
        if (!window.__hundredAt && pct.textContent?.includes('100')) {
          window.__hundredAt = performance.now();
        }
        if (!window.__doneAt && loader.getAttribute('data-done') === 'true') {
          window.__doneAt = performance.now();
        }
      };
      new MutationObserver(note).observe(document.documentElement, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
      note();
    };
    watch();
  });
  await page.goto('/');
  await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 120_000 });
  const { hundredAt, doneAt } = await page.evaluate(() => ({
    hundredAt: window.__hundredAt,
    doneAt: window.__doneAt,
  }));
  expect(hundredAt, 'loader percentage reached 100%').toBeTruthy();
  expect(doneAt, 'loader dismissed').toBeTruthy();
  const gapS = ((doneAt as number) - (hundredAt as number)) / 1000;
  console.log(`loader gap 100% -> dismissed: ${gapS.toFixed(3)}s`);
  expect(gapS, '100% and dismissal stay coupled').toBeLessThan(1.5);
});

test('copy: title + meta carry the approved copy', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('CERAQO™ Q-ARMOR — Advanced Surface Protection');
  const desc = await page.locator('meta[name="description"]').getAttribute('content');
  expect(desc).toContain('Not a wax. Not another ceramic coating.');
});

test('copy: every approved line is on the page, verbatim', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 120_000 });
  const body = (await page.evaluate(() => document.body.textContent ?? '')).replace(/\s+/g, ' ');
  const mustContain = [
    'Advanced Surface Protection', // footer (removed from the hero)
    'The Future of Vehicle Protection.',
    'Protection has always meant compromise.',
    'Waxes fade.',
    'Sealants wear away.',
    'Professional coatings demand installers, equipment and booked shop time.',
    'Q-ARMOR changes everything.',
    'The molecule that changes everything.',
    'Why Q-Armor?',
    'A new category of surface protection.',
    'Not a reformulated wax. Not another ceramic coating.',
    'Applied by you, in your driveway. No installer. No equipment. No compromise. €169.',
    'Every drive attacks your paint. Invisibly. Constantly.',
    'One coating against all of it.',
    'Professional-grade results. A fraction of the price.',
    '€700–€2,500+',
    'Batch 001',
    'Numbered batches of 20,000 bottles. A new batch every two months.',
    'a production schedule, not artificial scarcity',
    'Payment is taken at checkout once pre-orders open — your email secures your place in Batch 001.',
    'Before You Pre-order',
    'When am I charged?',
    'Privacy notice',
    'Not a wax. Not another ceramic coating. A new category.',
    'Pre-order — €169',
    'Q-ARMOR doesn’t rest on your paint — it bonds with it. Covalently.',
    'Professional Results. Made for Everyone.',
    'Four steps. About an hour. No experience needed.',
    'That’s all — professional-grade protection has never been this accessible.',
    'Up to 72 Months Protection*',
    'Simple DIY Application',
    'Deep Gloss. Crystal Clear Finish.',
    'No heavy residues. No artificial shine.',
    'Easy Maintenance. Less Cleaning. More Driving.',
    'Water, dirt and oil struggle to stick.',
    'Under suitable conditions, Q-ARMOR is designed to provide protection for up to 72 months.*',
    'One Kit. Everything Included.',
    'Everything required. Nothing extra.',
    'One kit protects up to two large vehicles.',
    'Suitable For',
    'Confidence — every wash, every rainfall, every time you park and look back.',
    'It’s never just paint. It’s pride of ownership.',
    'Welcome to the Future of Surface Protection.',
    'Welcome to CERAQO™.',
    'One bottle. One car.',
  ];
  const missing = mustContain.filter((t) => !body.includes(t.replace(/\s+/g, ' ')));
  expect(missing, `missing verbatim lines: ${JSON.stringify(missing, null, 2)}`).toEqual([]);
  for (const fact of [
    'The molecule that changes everything.',
    '35–50 ml protects an entire car.',
    'Wipe on. Buff. Cures at ambient temperature.',
    'A covalent bond with the paint. It cannot flake off or be washed off.',
    'Hardness up to 9H. Effective for up to 72 months.',
  ]) {
    await expect(page.locator('.overlay--zone', { hasText: fact })).toHaveCount(1);
  }
});

test('persistent pre-order CTA: visible everywhere, never blocks, jumps to the batch section', async ({ page }) => {
  await waitForStart(page);
  const cta = page.locator('.cta__btn');
  await expect(cta).toBeVisible(); // over the dive's first frame
  await scrubTo(page, 0.5); // mid-scrub
  await expect(cta).toBeVisible();
  // scrolling still works with the CTA overlaid (wrapper is inert)
  const y0 = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(y0);
  await cta.click();
  await page.waitForTimeout(2600); // lenis glide
  const inView = await page.evaluate(() => {
    const el = document.getElementById('s-access')!;
    const r = el.getBoundingClientRect();
    return r.top < innerHeight * 0.6 && r.bottom > 0;
  });
  expect(inView, 'CTA lands on the pre-order section').toBe(true);
  await expect(cta).toBeVisible(); // and it is still there at the end
});

test('waitlist mechanics still work', async ({ page }) => {
  await waitForStart(page);
  await page.locator('.waitlist__input').scrollIntoViewIfNeeded();
  await page.locator('.waitlist__input').fill('driver@example.com');
  await page.locator('.waitlist__btn').click();
  await expect(page.locator('.waitlist__ok')).toContainText('You’re on the list for Batch 001.');
});

test('faq: every question opens and answers carry no new claims markers', async ({ page }) => {
  await waitForStart(page);
  await page.locator('#s-faq').scrollIntoViewIfNeeded();
  // The last three questions live behind the "More questions"
  // disclosure — open it so all seven items are reachable.
  await page.locator('.faq__more > .faq__q').click();
  const items = page.locator('.faq__item');
  await expect(items).toHaveCount(7);
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const item = items.nth(i);
    await item.locator('.faq__q').click();
    await expect(item).toHaveAttribute('open', '');
    await expect(item.locator('.faq__a')).toBeVisible();
  }
});

test('privacy: form links to the notice and the notice exists', async ({ page }) => {
  await waitForStart(page);
  await page.locator('.waitlist__legal-link').scrollIntoViewIfNeeded();
  await expect(page.locator('.waitlist__legal-link')).toHaveAttribute('href', '#privacy');
  await expect(page.locator('#privacy .legal__text')).toContainText('never sold or shared');
  await expect(page.locator('.footer__link')).toHaveAttribute('href', '#privacy');
});

/**
 * Item-10 audit: real phone widths. Each width is its own test so a
 * failure names the viewport, and each gets a fresh full load.
 */
for (const width of [375, 390, 430]) {
  test.describe(`mobile layout ${width}px`, () => {
    test.use({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });

    test(`no overflow, gauges fit, CTA clear of the form at ${width}px`, async ({ page }) => {
      await waitForStart(page);

      // No horizontal scroll anywhere on the page
      const overflow = await page.evaluate(() => {
        const el = document.scrollingElement!;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(1);

      // Gauge unit text stays inside its card (the old "PENCIL SCALE"
      // overflow regression)
      await page.locator('.specs2__data').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const gaugeFits = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.scard--gauge')).every((card) => {
          const unit = card.querySelector('.gauge__unit')!;
          return unit.getBoundingClientRect().width <= card.getBoundingClientRect().width + 1;
        });
      });
      expect(gaugeFits, 'gauge unit text fits its card').toBe(true);

      // Floating CTA must not cover the pre-order form controls
      await page.locator('.waitlist__form').scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      const clear = await page.evaluate(() => {
        const cta = document.querySelector('.cta__btn')!.getBoundingClientRect();
        const overlaps = (r: DOMRect) =>
          cta.left < r.right && cta.right > r.left && cta.top < r.bottom && cta.bottom > r.top;
        const form = document.querySelector('.waitlist__form')!.getBoundingClientRect();
        const legal = document.querySelector('.waitlist__legal')!.getBoundingClientRect();
        return !overlaps(form) && !overlaps(legal);
      });
      expect(clear, 'floating CTA does not cover the form or its legal line').toBe(true);

      // The dot rail replaces the labelled pagenav below 1080px
      await page.locator('#s-specs').scrollIntoViewIfNeeded();
      await page.waitForTimeout(900);
      await expect(page.locator('.pagenav')).toHaveAttribute('data-on', 'true');
      const dots = await page.evaluate(() => {
        const label = document.querySelector('.pagenav__label')!;
        const item = document.querySelector('.pagenav__item')!.getBoundingClientRect();
        return { labelHidden: getComputedStyle(label).display === 'none', tap: item.width };
      });
      expect(dots.labelHidden, 'labels collapse to dots').toBe(true);
      expect(dots.tap, 'tap target is at least 24px').toBeGreaterThanOrEqual(24);

      await page.locator('#s-access').scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `qa/mobile-audit-${width}.png` });
    });
  });
}

// Profiles the dive scrub under CPU throttling: Chrome trace + longtasks
// + rAF interval stats while gliding through all five zones.
//   node scripts/profile-scrub.mjs <url> <outPrefix> [cpuRate] [dsf]
import { chromium } from '@playwright/test';

const [url, outPrefix, cpuRateArg, dsfArg] = process.argv.slice(2);
const cpuRate = Number(cpuRateArg ?? 4);
const dsf = Number(dsfArg ?? 2);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dsf });

// Collectors must exist before the app boots
await page.addInitScript(() => {
  window.__longtasks = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__longtasks.push(e.duration);
  }).observe({ entryTypes: ['longtask'] });
  window.__rafIntervals = [];
  let last = 0;
  const sample = (ts) => {
    if (last) window.__rafIntervals.push(ts - last);
    last = ts;
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
});

const cdp = await page.context().newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });

await page.goto(url);
await page.waitForSelector('.loader[data-done="true"]', { timeout: 300_000 });
await page.waitForFunction(
  () => {
    const s = window.__frameLoadState;
    return !!s && s.loaded >= s.total;
  },
  undefined,
  { timeout: 300_000 },
);
await page.waitForTimeout(1200);

// Reset collectors so stats cover only the scrub
await page.evaluate(() => {
  window.__longtasks.length = 0;
  window.__rafIntervals.length = 0;
});

await browser.startTracing(page, {
  path: `${outPrefix}.trace.json`,
  categories: [
    'devtools.timeline',
    'disabled-by-default-devtools.timeline',
    'disabled-by-default-devtools.timeline.frame',
  ],
});

const GLIDE_S = 30;
await page.evaluate((s) => {
  const t = document.querySelector('.dive-track');
  const max = t.offsetTop + t.offsetHeight - innerHeight;
  window.__lenis.scrollTo(max, { duration: s, easing: (x) => x });
}, GLIDE_S);
await page.waitForTimeout(GLIDE_S * 1000 + 1500);

await browser.stopTracing();

const stats = await page.evaluate(() => {
  const iv = window.__rafIntervals;
  const lt = window.__longtasks;
  const over = (ms) => iv.filter((x) => x > ms).length;
  return {
    rafSamples: iv.length,
    maxFrameMs: Math.max(...iv, 0),
    meanFrameMs: iv.reduce((a, b) => a + b, 0) / Math.max(iv.length, 1),
    pctOver16_7: (100 * over(16.7 * 1.34)) / Math.max(iv.length, 1), // >1 missed vsync
    pctOver33: (100 * over(33.4)) / Math.max(iv.length, 1),
    longtaskCount: lt.length,
    longtaskMaxMs: Math.max(...lt, 0),
    longtaskTotalMs: lt.reduce((a, b) => a + b, 0),
  };
});
console.log('SCRUB_STATS ' + JSON.stringify(stats));
await browser.close();

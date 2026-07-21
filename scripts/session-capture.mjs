// Records a realistic ~60s varied-scroll session: screencast video +
// Chrome trace + longtask/rAF stats. The pattern includes slow, medium
// and fast glides, deliberate small direction reversals (scroll-end
// jitter), a rail jump, and no full stops — comparable to a real user
// recording for frame-diff freeze analysis.
//   node scripts/session-capture.mjs <url> <outPrefix> [cpuRate] [dsf]
import { chromium } from '@playwright/test';

const [url, outPrefix, cpuRateArg, dsfArg] = process.argv.slice(2);
const cpuRate = Number(cpuRateArg ?? 1);
const dsf = Number(dsfArg ?? 2);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: dsf,
  recordVideo: { dir: `${outPrefix}.videodir`, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();

await page.addInitScript(() => {
  window.__longtasks = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__longtasks.push({ t: e.startTime, d: e.duration });
  }).observe({ entryTypes: ['longtask'] });
});

const cdp = await ctx.newCDPSession(page);
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
await page.waitForTimeout(800);

await browser.startTracing(page, {
  path: `${outPrefix}.trace.json`,
  categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'],
});

// Continuous-motion session: every segment advances >=15 frame-indices
// per second so legitimate near-static film moments never register as
// freezes — any below-threshold frame diff means starvation or a stall.
// Direction reversals are embedded at full motion (the churn trigger).
await page.evaluate(async () => {
  const t = document.querySelector('.dive-track');
  const max = t.offsetTop + t.offsetHeight - innerHeight;
  const lenis = window.__lenis;
  const go = (p, dur) =>
    new Promise((res) => {
      lenis.scrollTo(Math.round(p * max), { duration: dur, easing: (x) => x });
      setTimeout(res, dur * 1000);
    });
  // White corner marker frames delimit the active-scrub window for the
  // frame-diff analysis (mirrors the cropped user recording).
  const marker = () =>
    new Promise((res) => {
      const el = document.createElement('div');
      el.style.cssText =
        'position:fixed;top:0;left:0;width:56px;height:56px;background:#fff;z-index:99999';
      document.body.appendChild(el);
      setTimeout(() => {
        el.remove();
        setTimeout(res, 120);
      }, 200);
    });
  window.__marker = marker;
  await marker();
  await go(0.22, 5); // medium descent through OBJECT
  await go(0.18, 1); // full-speed reversal
  await go(0.42, 5); // into SPREAD
  await go(0.38, 1); // reversal
  await go(0.62, 4); // fast into BOND
  await go(0.56, 1.2); // reversal
  await go(0.8, 4); // into LATTICE
  await go(1.0, 4); // finish
  await go(0.7, 3); // back up fast
  await go(0.35, 5); // continue up medium
  await go(0.5, 3); // down again
  await window.__marker();
});
await page.waitForTimeout(600);

await browser.stopTracing();

const stats = await page.evaluate(() => ({
  longtaskCount: window.__longtasks.length,
  longtaskMaxMs: Math.max(...window.__longtasks.map((x) => x.d), 0),
  longtaskTotalMs: window.__longtasks.reduce((a, b) => a + b.d, 0),
  dive: window.__diveStats ?? null,
}));
console.log('SESSION_STATS ' + JSON.stringify(stats));

const video = page.video();
await ctx.close();
const path = await video.path();
console.log('VIDEO ' + path);
await browser.close();

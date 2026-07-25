// Trackpad-style ground truth: high-frequency small-delta wheel input
// (the macOS momentum signature) on a Retina-density context (dsf 2 ->
// the hidpi frame tier, like a MacBook). Marker bursts bracket the
// active window for freeze analysis.
//   node scripts/trackpad-capture.mjs <url> <outPrefix>
import { chromium } from '@playwright/test';

const [url, outPrefix] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  recordVideo: { dir: `${outPrefix}.videodir`, size: { width: 1280, height: 800 } },
});
const page = await ctx.newPage();
await page.goto(url);
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 180_000 });
await page.waitForTimeout(900);

await page.evaluate(() => {
  window.__marker = () =>
    new Promise((res) => {
      const el = document.createElement('div');
      el.style.cssText =
        'position:fixed;top:0;left:0;width:56px;height:56px;background:#fff;z-index:99999';
      document.body.appendChild(el);
      setTimeout(() => {
        el.remove();
        setTimeout(res, 140);
      }, 220);
    });
  window.__longtasks = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__longtasks.push(e.duration);
  }).observe({ entryTypes: ['longtask'] });
});

const cdp = await ctx.newCDPSession(page);
// One trackpad "flick": a burst of growing deltas then a long momentum
// decay tail of tiny deltas — dozens of events per second.
const flick = async (dir, strength) => {
  const deltas = [];
  for (let i = 0; i < 6; i++) deltas.push(dir * (4 + i * strength * 0.5));
  let v = dir * strength * 3.2;
  while (Math.abs(v) > 2) {
    deltas.push(v);
    v *= 0.93;
  }
  for (const d of deltas) {
    await cdp.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 720,
      y: 450,
      deltaX: 0,
      deltaY: d,
    });
    await new Promise((r) => setTimeout(r, 9));
  }
};

await page.evaluate(() => window.__marker());
// A realistic Mac session: fast flicks down, momentum tails, slow
// two-finger drags, direction reversals mid-momentum.
await flick(1, 10);
await flick(1, 14);
await flick(1, 6);
await flick(-1, 8); // reversal
await flick(1, 16);
await flick(1, 16);
await flick(-1, 12);
await flick(1, 9);
await flick(1, 18);
await flick(1, 12);
await flick(-1, 16);
await flick(-1, 8);
await flick(1, 14);
await flick(1, 10);
await page.evaluate(() => window.__marker());

const stats = await page.evaluate(() => ({
  longtasks: window.__longtasks.length,
  longtaskTotal: Math.round(window.__longtasks.reduce((a, b) => a + b, 0)),
  dive: window.__diveStats ?? null,
  scrollY: Math.round(scrollY),
}));
console.log('STATS ' + JSON.stringify(stats));
const video = page.video();
await ctx.close();
console.log('VIDEO ' + (await video.path()));
await browser.close();

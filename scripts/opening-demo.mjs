// The step-2 gate deliverable: a recording of the Opening scrubbed
// forward (slow), then backward (reversibility on camera), then the
// handoff into the intro copy. Also samples rAF intervals during the
// forward scrub as a perf indicator.
import { chromium } from '@playwright/test';
const S = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: `${S}/opening.videodir`, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();
await page.goto('http://localhost:4173/');
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 60_000 });
await page.waitForTimeout(1200);
const info = await page.evaluate(() => {
  const s = document.querySelector('.opening');
  return { top: s.getBoundingClientRect().top + scrollY, span: s.offsetHeight - innerHeight };
});
const glide = (y, dur) =>
  page.evaluate(
    ([target, d]) =>
      new Promise((res) => {
        window.__lenis.scrollTo(target, { duration: d, easing: (x) => x, lock: true, onComplete: res });
        setTimeout(res, d * 1000 + 400);
      }),
    [y, dur],
  );
// perf sampler on
await page.evaluate(() => {
  window.__raf = [];
  let last = performance.now();
  const loop = (t) => {
    window.__raf.push(t - last);
    last = t;
    if (window.__raf.length < 3000) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});
// forward: hero -> full Opening, slow
await glide(info.top, 2.2);
await page.waitForTimeout(400);
await glide(info.top + info.span, 16);
await page.waitForTimeout(700);
// backward: reversibility
await glide(info.top + info.span * 0.25, 7);
await page.waitForTimeout(500);
// forward again + handoff into the intro copy below
await glide(info.top + info.span, 9);
await glide(info.top + info.span + 720 * 1.4, 3);
await page.waitForTimeout(900);
const raf = await page.evaluate(() => {
  const a = window.__raf.filter((x) => x > 0);
  a.sort((x, y) => x - y);
  const mean = a.reduce((s, v) => s + v, 0) / a.length;
  return { frames: a.length, meanMs: +mean.toFixed(1), p95Ms: +a[Math.floor(a.length * 0.95)].toFixed(1) };
});
console.log('RAF ' + JSON.stringify(raf));
const video = page.video();
await ctx.close();
console.log('VIDEO ' + (await video.path()));
await browser.close();

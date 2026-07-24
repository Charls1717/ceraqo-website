// Full-page scroll-through recording for the background-fix review:
// hero -> intro -> dive capture -> rail to LATTICE -> exit clip ->
// slow continuous glide through every content section to the footer.
import { chromium } from '@playwright/test';
const S = process.argv[2];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: `${S}/bg.videodir`, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();
await page.goto('http://localhost:4173/');
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 60_000 });
await page.waitForTimeout(1400);
// hero -> intro -> dive
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(0, 260);
  await page.waitForTimeout(130);
  if ((await page.evaluate(() => window.__diveState?.captured)) === true) break;
}
await page.waitForFunction(() => window.__diveState?.mode === 'rest');
await page.waitForTimeout(1500);
// jump to LATTICE, then exit into the page
await page.locator('.hud__zone').nth(4).click();
await page.waitForFunction(() => window.__diveState?.state === 4 && window.__diveState.mode === 'rest');
await page.waitForTimeout(1100);
await page.mouse.wheel(0, 260);
await page.waitForFunction(() => window.__diveState?.captured === false, undefined, { timeout: 30_000 });
await page.waitForTimeout(1800);
// slow continuous glide to the footer
await page.evaluate(async () => {
  const max = document.body.scrollHeight - innerHeight;
  await new Promise((res) => {
    window.__lenis.scrollTo(max, { duration: 26, easing: (x) => x, lock: true, onComplete: res });
    setTimeout(res, 27_000);
  });
});
await page.waitForTimeout(1500);
const video = page.video();
await ctx.close();
console.log('VIDEO ' + (await video.path()));
await browser.close();

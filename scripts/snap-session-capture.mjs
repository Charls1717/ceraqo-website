// Ground-truth capture of the snap dive: a real Playwright screencast
// of a visitor wheel-stepping through every transition, bracketed by
// white corner-marker bursts so freeze-analysis.py can score each
// playback window separately (rest dwells are static BY DESIGN in the
// snap model — only the motion windows are meaningful).
//
// Window plan (between consecutive marker bursts):
//   W1 approach scroll (hero -> intro -> capture)
//   W2 t1 OBJECT->DROP      W3 t2 DROP->SPREAD
//   W4 t3 SPREAD->BOND      W5 t4 BOND->LATTICE (10.5s)
//   W6 t5 exit (5.4s)       W7 two backward cross-fades
//
//   node scripts/snap-session-capture.mjs <url> <outPrefix> [cpuRate]
import { chromium } from '@playwright/test';

const [url, outPrefix, cpuRateArg] = process.argv.slice(2);
const cpuRate = Number(cpuRateArg ?? 1);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: `${outPrefix}.videodir`, size: { width: 1280, height: 720 } },
});
const page = await ctx.newPage();

const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });

await page.goto(url);
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 120_000 });
await page.waitForTimeout(700);

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
});
const marker = () => page.evaluate(() => window.__marker());
const dive = () => page.evaluate(() => window.__diveState);

const waitState = (pred, timeout = 30_000) =>
  page.waitForFunction(
    (p) => {
      const d = window.__diveState;
      if (!d) return false;
      // eslint-disable-next-line no-new-func
      return new Function('d', `return (${p})`)(d);
    },
    pred,
    { timeout },
  );

// W1: the approach — normal page scrolling into capture
await marker();
for (let i = 0; i < 40; i++) {
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(110);
  if ((await dive())?.captured) break;
}
await waitState('d.captured === true && d.mode === "rest"');
await page.waitForTimeout(450);

// W2..W6: the five forward playbacks
for (let stepIdx = 0; stepIdx < 5; stepIdx++) {
  await marker();
  await page.mouse.wheel(0, 260);
  await waitState('d.mode === "video"', 10_000);
  if (stepIdx < 4) {
    await waitState('d.mode === "rest"', 30_000);
  } else {
    await waitState('d.captured === false', 30_000); // exit releases
  }
  await page.waitForTimeout(350);
  console.log(`step ${stepIdx + 1} done:`, JSON.stringify(await dive()));
}

// W7: recapture from below, then two backward cross-fades
await page.waitForTimeout(2000); // let the release glide + cooldown pass
await marker();
for (let i = 0; i < 12; i++) {
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(260);
  if ((await dive())?.captured) break;
}
await waitState('d.captured === true', 10_000);
await waitState('d.mode === "rest"', 10_000);
await page.waitForTimeout(400);
await page.mouse.wheel(0, -260);
await waitState('d.mode === "rest" && d.state === 3', 10_000);
await page.waitForTimeout(450);
await page.mouse.wheel(0, -260);
await waitState('d.mode === "rest" && d.state === 2', 10_000);
await page.waitForTimeout(350);
await marker();

console.log('final:', JSON.stringify(await dive()));
const video = page.video();
await ctx.close();
const path = await video.path();
console.log('VIDEO ' + path);
await browser.close();

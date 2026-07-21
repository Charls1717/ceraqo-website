// Quick interactive smoke of the snap dive: loader gap, capture, one
// forward step, one backward step, release into content.
//   node scripts/smoke-snap.mjs [url]
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4173/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const t0 = Date.now();
await page.goto(url);

// Loader gap: time between the pct text reading 100% and data-done
await page.exposeFunction('__noteHundred', () => {
  if (!page.__hundredAt) page.__hundredAt = Date.now();
});
await page.evaluate(() => {
  const pct = document.querySelector('.loader__pct');
  if (!pct) return;
  const check = () => {
    if (pct.textContent?.includes('100')) window.__noteHundred();
  };
  new MutationObserver(check).observe(pct, { childList: true, subtree: true, characterData: true });
  check();
});
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 60_000 });
const doneAt = Date.now();
console.log('loader done at', ((doneAt - t0) / 1000).toFixed(2) + 's',
  'gap 100%->done:', page.__hundredAt ? ((doneAt - page.__hundredAt) / 1000).toFixed(2) + 's' : 'n/a');

await page.screenshot({ path: 'qa/smoke-hero.png' });

// Scroll through intro toward the dive
for (let i = 0; i < 30; i++) {
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(90);
  const captured = await page.evaluate(() => window.__diveState?.captured ?? false);
  if (captured) break;
}
let st = await page.evaluate(() => window.__diveState);
console.log('after approach:', JSON.stringify(st));
await page.waitForTimeout(900);
await page.screenshot({ path: 'qa/smoke-capture.png' });

// One forward step
await page.mouse.wheel(0, 240);
await page.waitForTimeout(400);
st = await page.evaluate(() => window.__diveState);
console.log('after step wheel:', JSON.stringify(st));
const magDuring = await page.locator('.hud__mag').textContent();
await page.waitForFunction(() => window.__diveState?.mode === 'rest' && window.__diveState.state === 1, undefined, { timeout: 20_000 });
const magAfter = await page.locator('.hud__mag').textContent();
console.log('arrived DROP · mag mid:', magDuring, '· mag at rest:', magAfter);
await page.waitForTimeout(700);
await page.screenshot({ path: 'qa/smoke-drop.png' });

// Backward step
await page.waitForTimeout(600);
await page.mouse.wheel(0, -240);
await page.waitForFunction(() => window.__diveState?.mode === 'rest' && window.__diveState.state === 0, undefined, { timeout: 8_000 });
console.log('back at OBJECT · mag:', await page.locator('.hud__mag').textContent());

// Rail jump to LATTICE
await page.locator('.hud__zone').nth(4).click();
await page.waitForFunction(() => window.__diveState?.state === 4 && window.__diveState.mode === 'rest', undefined, { timeout: 8_000 });
console.log('rail jump -> LATTICE · mag:', await page.locator('.hud__mag').textContent());
await page.waitForTimeout(700);
await page.screenshot({ path: 'qa/smoke-lattice.png' });

// Exit: one more down step plays the exit clip then releases
await page.waitForTimeout(500);
await page.mouse.wheel(0, 240);
await page.waitForTimeout(400);
st = await page.evaluate(() => window.__diveState);
console.log('exit playing:', JSON.stringify(st));
await page.waitForFunction(() => window.__diveState?.captured === false, undefined, { timeout: 20_000 });
await page.waitForTimeout(1600);
const scrollY = await page.evaluate(() => Math.round(window.scrollY));
const diveTop = await page.evaluate(() => {
  const d = document.getElementById('dive');
  return Math.round(d.getBoundingClientRect().top + window.scrollY);
});
console.log('released · scrollY', scrollY, '· diveTop', diveTop, '· past dive:', scrollY > diveTop);
await page.screenshot({ path: 'qa/smoke-released.png' });

await browser.close();
console.log('SMOKE OK');

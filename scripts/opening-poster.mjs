import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:4173/');
await page.waitForSelector('.loader[data-done="true"]', { state: 'attached', timeout: 60_000 });
const info = await page.evaluate(() => {
  const s = document.querySelector('.opening');
  return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight - innerHeight };
});
await page.evaluate(([y]) => window.__lenis.scrollTo(y, { immediate: true, force: true }), [info.top + info.h * 0.97]);
await page.waitForTimeout(900);
await page.locator('.opening-canvas').screenshot({ path: 'qa/opening-poster-src.png' });
await browser.close();
console.log('poster captured');

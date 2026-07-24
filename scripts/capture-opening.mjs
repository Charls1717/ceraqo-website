/**
 * Opening-scene demo probe: screenshots the cap-lift → droplet →
 * nanolayer choreography at six scroll depths inside the `opening`
 * station and prints the raw debug-hook values (progress, capLift,
 * phase) for each — the working-scroll-demo evidence for step 2.
 *
 *   node scripts/capture-opening.mjs
 */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";

const server = spawn("node", ["scripts/serve-out.mjs"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("http://localhost:4173/");
await page.waitForFunction(() => !!window.__CERAQO_OPENING__, undefined, { timeout: 30_000 });
await page.waitForTimeout(1500);

const samples = [];
for (const local of [0.08, 0.3, 0.55, 0.68, 0.82, 0.97]) {
  await page.evaluate((p) => {
    const el = document.getElementById("opening");
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const start = el.offsetTop / max;
    const end = (el.offsetTop + el.offsetHeight - window.innerHeight) / max;
    window.scrollTo({ top: (start + (end - start) * p) * max, behavior: "instant" });
  }, local);
  await page.waitForTimeout(2200); // let the damped camera settle
  samples.push(
    await page.evaluate((p) => ({
      at: p,
      progress: window.__CERAQO_OPENING__.progress(),
      capLift: window.__CERAQO_OPENING__.capLift(),
      phase: window.__CERAQO_OPENING__.phase(),
    }), local),
  );
  await page.screenshot({ path: `qa/__screenshots__/opening-${String(Math.round(local * 100)).padStart(2, "0")}.png` });
}
console.log("OPENING_RAW", JSON.stringify(samples));

// Reversibility: return to the start — the cap must re-seat.
await page.evaluate(() => {
  const el = document.getElementById("opening");
  window.scrollTo({ top: el.offsetTop - window.innerHeight * 0.5, behavior: "instant" });
});
await page.waitForTimeout(2500);
console.log("OPENING_REVERSED", JSON.stringify(await page.evaluate(() => ({
  capLift: window.__CERAQO_OPENING__.capLift(),
  phase: window.__CERAQO_OPENING__.phase(),
}))));

await browser.close();
server.kill();

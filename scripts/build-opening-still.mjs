/**
 * Renders the Opening's film-moment frame from the live WebGL scene and
 * ships it as the static-fallback still (public/media/opening-still.webp)
 * — the image reduced-motion visitors see in place of the scroll scene.
 *   node scripts/build-opening-still.mjs   (expects a plain-path build in out/)
 */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import sharp from "sharp";

const server = spawn("node", ["scripts/serve-out.mjs"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto("http://localhost:4173/");
await page.waitForFunction(() => !!window.__CERAQO_OPENING__, undefined, { timeout: 30_000 });
await page.evaluate(() => {
  const el = document.getElementById("opening");
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const start = el.offsetTop / max;
  const end = (el.offsetTop + el.offsetHeight - window.innerHeight) / max;
  window.scrollTo({ top: (start + (end - start) * 0.68) * max, behavior: "instant" });
});
await page.waitForTimeout(2600);
const buf = await page.locator("canvas").screenshot();
await sharp(buf).webp({ quality: 84 }).toFile("public/media/opening-still.webp");
console.log("public/media/opening-still.webp written");
await browser.close();
server.kill();

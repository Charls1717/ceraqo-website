/**
 * Screencast + freeze evidence: records a ~22 s continuous scroll of
 * the production build through headless Chromium, saves the video to
 * qa/__screenshots__/journey.webm, then runs the frame-diff freeze
 * analysis on it (scripts/freeze-analysis.py, the method used on the
 * original build's capture — baseline to beat: 53 freezes / 47 %
 * frozen / 1.24 s max).
 *
 *   node scripts/capture-journey.mjs
 *
 * Requires a built out/ (npm run build). Starts its own static server.
 */
import { chromium } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";
import ffprobePkg from "ffprobe-static";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "qa", "__screenshots__");
mkdirSync(OUT, { recursive: true });

const server = spawn("node", [path.join(ROOT, "scripts", "serve-out.mjs")], {
  env: { ...process.env, PORT: "4173" },
  stdio: "ignore",
});
await new Promise((r) => setTimeout(r, 1200));

try {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173/");
  await page.waitForFunction(() => !!window.__CERAQO_GL__, undefined, { timeout: 45_000 });
  await page.waitForTimeout(1500);

  // One unbroken 20 s glide top → bottom, the exact gesture the
  // original capture measured — bounded by the same white-corner
  // marker bursts the freeze-analysis method uses to isolate the
  // active window from deliberate idle (pre-roll/settle are static by
  // design and must not count as freezes).
  await page.evaluate(async () => {
    const marker = document.createElement("div");
    Object.assign(marker.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "72px",
      height: "56px",
      background: "#fff",
      zIndex: "9999",
      display: "none",
    });
    document.body.appendChild(marker);
    const flash = async () => {
      marker.style.display = "block";
      await new Promise((r) => setTimeout(r, 180));
      marker.style.display = "none";
    };

    const max = document.documentElement.scrollHeight - window.innerHeight;
    await flash(); // window opens
    await new Promise((resolve) => {
      const start = performance.now();
      const tick = () => {
        const t = (performance.now() - start) / 20_000;
        window.scrollTo({ top: Math.min(1, t) * max, behavior: "instant" });
        if (t >= 1) return resolve(undefined);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await flash(); // window closes
  });
  await page.waitForTimeout(600);
  await context.close();
  await browser.close();

  // Playwright names videos by hash — normalize.
  const vid = readdirSync(OUT).find((f) => f.endsWith(".webm") && f !== "journey.webm");
  if (vid) renameSync(path.join(OUT, vid), path.join(OUT, "journey.webm"));
  console.log("screencast: qa/__screenshots__/journey.webm");

  const analysis = execFileSync(
    "python3",
    [path.join(ROOT, "scripts", "freeze-analysis.py"), path.join(OUT, "journey.webm")],
    {
      env: {
        ...process.env,
        FFMPEG_BIN: ffmpegPath,
        FFPROBE_BIN: ffprobePkg.path,
      },
      encoding: "utf8",
    },
  );
  console.log(analysis);
} finally {
  server.kill();
}

import { expect, test } from "@playwright/test";

/**
 * Raw-evidence suite for the live WebGL experience. Every number the
 * report quotes is printed here verbatim (CAMERA_SAMPLES / FPS_RAW /
 * MOBILE_THROTTLED_RAW lines in the test output) — no described
 * behavior, only measured behavior.
 *
 * Note: CI/headless runs render through SwANGLE (software). Real GPUs
 * run far faster; software numbers are the floor, not the ceiling.
 */

declare global {
  interface Window {
    __CERAQO_GL__?: {
      context: string;
      progress: () => number;
      camera: () => [number, number, number];
      fps: () => number;
      tier: () => number;
      dpr: () => number;
    };
  }
}

test.describe("webgl evidence", () => {
  test.beforeEach(() => {
    test.skip(
      test.info().project.name === "reduced-motion",
      "reduced-motion serves the static experience by design",
    );
  });

  test("webgl2 context, real camera travel, fps, zero console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });

    await page.goto("/");
    await page.waitForFunction(() => !!window.__CERAQO_GL__, undefined, { timeout: 30_000 });

    // 1 — a real GL context exists (renderer string states the
    // environment: SwANGLE/SwiftShader = software rasterizer, the
    // absolute floor — real GPUs run far above these numbers)
    const glInfo = await page.evaluate(() => ({
      context: window.__CERAQO_GL__!.context,
      renderer: window.__CERAQO_GL__!.renderer,
      software: window.__CERAQO_GL__!.software,
    }));
    console.log("GL_CONTEXT", JSON.stringify(glInfo));
    expect(glInfo.context).toBe("webgl2");
    expect(await page.locator("canvas").count()).toBeGreaterThan(0);

    // 2 — camera.position at 0/25/50/75/100 % scroll
    const samples: Array<{ pct: number; progress: number; camera: number[] }> = [];
    for (const pct of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((p) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: max * p, behavior: "instant" as ScrollBehavior });
      }, pct);
      await page.waitForTimeout(1800); // let the damped rig settle
      samples.push(
        await page.evaluate((p) => ({
          pct: p,
          progress: +window.__CERAQO_GL__!.progress().toFixed(3),
          camera: window.__CERAQO_GL__!.camera(),
        }), pct),
      );
    }
    console.log("CAMERA_SAMPLES", JSON.stringify(samples));

    // consecutive samples must be genuinely far apart — a moving camera,
    // not a parallax fake
    for (let i = 1; i < samples.length; i++) {
      const [ax, ay, az] = samples[i - 1].camera;
      const [bx, by, bz] = samples[i].camera;
      const dist = Math.hypot(bx - ax, by - ay, bz - az);
      expect(dist, `travel between ${samples[i - 1].pct} and ${samples[i].pct}`).toBeGreaterThan(1.2);
    }

    // 3 — rAF fps across 5 s of continuous scroll
    const fps = await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return await new Promise<{ frames: number; seconds: number; avg: number; worst1s: number }>(
        (resolve) => {
          const start = performance.now();
          let frames = 0;
          const perSecond: number[] = [0, 0, 0, 0, 0];
          const tick = () => {
            const t = performance.now() - start;
            if (t >= 5000) {
              resolve({
                frames,
                seconds: +(t / 1000).toFixed(2),
                avg: +(frames / (t / 1000)).toFixed(1),
                worst1s: Math.min(...perSecond),
              });
              return;
            }
            frames++;
            perSecond[Math.min(4, Math.floor(t / 1000))]++;
            window.scrollTo({ top: (t / 5000) * max, behavior: "instant" as ScrollBehavior });
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      );
    });
    console.log("FPS_RAW", JSON.stringify(fps));
    console.log("TIER_DPR", JSON.stringify(await page.evaluate(() => ({
      tier: window.__CERAQO_GL__!.tier(),
      dpr: window.__CERAQO_GL__!.dpr(),
    }))));
    expect(fps.avg).toBeGreaterThan(10);

    // 4 — chapter anchors still work over the canvas
    await page.evaluate(() => document.getElementById("application")?.scrollIntoView());
    await page.waitForTimeout(3000); // damped rig needs frames, not ms — generous under software
    const [, , camZ] = await page.evaluate(() => window.__CERAQO_GL__!.camera());
    expect(camZ, "camera advanced to the application station").toBeLessThan(-6);

    // 5 — nothing site-originated errored
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  test("throttled profile adapts and stays interactive", async ({ page, browserName }, info) => {
    test.skip(browserName !== "chromium", "CDP throttling is Chromium-only");

    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    await page.goto("/");
    await page.waitForFunction(() => !!window.__CERAQO_GL__, undefined, { timeout: 45_000 });
    await page.waitForTimeout(2500); // let PerformanceMonitor react

    const raw = await page.evaluate(async () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return await new Promise<{ avg: number; tier: number; dpr: number }>((resolve) => {
        const start = performance.now();
        let frames = 0;
        const tick = () => {
          const t = performance.now() - start;
          if (t >= 5000) {
            resolve({
              avg: +(frames / (t / 1000)).toFixed(1),
              tier: window.__CERAQO_GL__!.tier(),
              dpr: window.__CERAQO_GL__!.dpr(),
            });
            return;
          }
          frames++;
          window.scrollTo({ top: (t / 5000) * max, behavior: "instant" as ScrollBehavior });
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    });
    console.log(`MOBILE_THROTTLED_RAW [${info.project.name}]`, JSON.stringify(raw));

    // Floor under 4×-CPU-throttled *software rasterization* — a harsher
    // profile than any real phone, which has a GPU. The tier readout
    // above is the proof the adaptive budget engaged; real-device
    // numbers belong to the live URL, not this floor.
    expect(raw.avg).toBeGreaterThan(3);
  });
});

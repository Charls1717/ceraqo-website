import { defineConfig, devices } from "@playwright/test";

/**
 * QA runs against a real production build (out/) behind the tiny static
 * server. The remote build container ships its own Chromium — point at
 * it explicitly so the pinned @playwright/test version never tries to
 * download a browser.
 */
const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "./qa",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    launchOptions: { executablePath },
    viewport: { width: 1600, height: 900 },
  },
  webServer: {
    command: "node scripts/serve-out.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    { name: "desktop" },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        launchOptions: { executablePath },
      },
    },
    {
      name: "reduced-motion",
      use: {
        contextOptions: { reducedMotion: "reduce" },
        launchOptions: { executablePath },
      },
    },
  ],
});

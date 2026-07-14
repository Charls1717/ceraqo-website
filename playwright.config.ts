import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './qa',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    // Use the environment's preinstalled Chromium instead of downloading
    // a per-version build (restricted egress).
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});

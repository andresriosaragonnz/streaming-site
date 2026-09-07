import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",

  use: {
    baseURL: "http://localhost:8788",
    trace: "on-first-retry",
    headless: true,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Launch both Cloudflare Wrangler worker and local media server
  webServer: [
    {
      command: "bunx wrangler dev --local --ip 0.0.0.0 --port 8788",
      port: 8788,
      timeout: 120 * 100,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "bun serve-media.ts",
      port: 8787, // Adjust this port if serve-media.ts listens on a different port (e.g., 3000, 8000)
      timeout: 120 * 100,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

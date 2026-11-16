import { defineConfig, devices } from "@playwright/test";

// E2E runs a production build (`npm run build` first) against the levelup_test database on :3101.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3101", timezoneId: "America/New_York", trace: "off" },
  globalSetup: "./tests/e2e/global-setup.ts",
  webServer: {
    command: "npx next start -p 3101",
    url: "http://localhost:3101/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
});

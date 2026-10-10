import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/fullstack",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://localhost:5175",
    channel: "chrome",
    headless: true,
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run dev -w client -- --port 5175 --strictPort",
      url: "http://localhost:5175",
      env: { API_TARGET: "http://127.0.0.1:4005" },
      reuseExistingServer: false,
    },
    {
      command: "node scripts/fullstack-test-server.mjs",
      url: "http://127.0.0.1:4005/api/health",
      timeout: 180000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});

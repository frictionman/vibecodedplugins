import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const PORT = 3100;
// A throwaway data dir so e2e runs never touch ./data
const DATA_DIR = path.join(__dirname, ".e2e-data");
fs.rmSync(DATA_DIR, { recursive: true, force: true });

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI builds in an earlier step; locally, build first so the test sees production behaviour.
    command: process.env.CI ? `npm run start -- --port ${PORT}` : `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { DATA_DIR },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});

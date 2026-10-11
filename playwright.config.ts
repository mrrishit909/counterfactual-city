import { defineConfig } from "@playwright/test";

// PW_PORT moves the preview off 4173 when another project on the machine is using it.
const PORT = Number(process.env.PW_PORT ?? 4173);

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: `npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: true,
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  // The three engines CI runs (one matrix job each: `--project=<name>`).
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});

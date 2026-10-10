import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./live_scratch",
  timeout: 30000,
  use: {
    baseURL: "https://mrrishit909.github.io/counterfactual-city/",
    screenshot: "only-on-failure",
  },
});

import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "verification", "SCREENSHOTS");

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const vp of viewports) {
  test(`intro evidence at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.getByTestId("city-stage")).toBeVisible();
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-start.png`) });

    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "auto" }));
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-midbeat.png`) });

    await page.getByTestId("skip-intro").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-handoff.png`) });
  });
}

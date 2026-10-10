import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolved from this file's own location, not the cwd a test runner happens to use, so this still
// writes inside the project's own verification/SCREENSHOTS/ regardless of where the runner is
// invoked from. ES module ("type": "module" in package.json), so __dirname isn't available directly.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, "..", "verification", "SCREENSHOTS");

test("production preview loads the real panel data and shows a DiD estimate", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await expect(page.getByTestId("att-value")).not.toHaveText("");
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, "cty-smoke-desktop.png"), fullPage: true });
});

test("CTY-INT-001: changing the intervention day via real keyboard input recomputes the ATT, and Reset Scenario restores baseline", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  const slider = page.locator("#intervention-day");
  const baselineValue = await slider.inputValue();
  const attBefore = await page.getByTestId("att-value").textContent();

  await slider.focus();
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("ArrowLeft");
  }
  const movedValue = await slider.inputValue();
  expect(movedValue).not.toBe(baselineValue);

  const attAfter = await page.getByTestId("att-value").textContent();
  expect(attAfter).not.toBe(attBefore);

  await page.getByRole("button", { name: /reset scenario/i }).click();
  await expect(slider).toHaveValue(baselineValue);
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`renders at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.getByTestId("did-result")).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `cty-${vp.name}.png`), fullPage: true });
    });
  }
});

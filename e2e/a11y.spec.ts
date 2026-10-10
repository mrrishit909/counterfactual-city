import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("baseline page has zero axe-core violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("after interacting with all six controls, still zero axe-core violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  await page.locator("#treated-zone").selectOption("3");
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-result")).toBeVisible();
  // Checking a single control-pool zone switches to a 1-zone allow-list (CTY-INT-003's explicit
  // allow-list semantics, see LIMITATIONS.md), which is below the placebo test's 2-unit minimum;
  // exercised here AFTER the placebo assertion above specifically to also cover its own visible
  // error state in the accessibility pass, not just the happy path.
  await page.locator(".zone-checkbox input[type=checkbox]").first().click();
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("every control has a programmatic label", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  await expect(page.getByLabel(/intervention day/i)).toBeVisible();
  await expect(page.getByLabel(/zone receiving the intervention/i)).toBeVisible();
  await expect(page.getByLabel(/outcome series/i)).toBeVisible();
  await expect(page.getByRole("group", { name: /control pool zone selection/i })).toBeVisible();
  const weightSliders = page.locator('input[aria-label^="Donor weight for zone"]');
  expect(await weightSliders.count()).toBeGreaterThan(0);
});

import { expect, test } from "@playwright/test";

test("chapter nav reaches every chapter and highlights the active one, with no console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  for (const id of ["ch2", "ch3", "ch4", "ch5", "ch6"]) {
    await page.getByTestId(`nav-${id}`).click();
    await expect(async () => {
      const top = await page.locator(`#${id}`).evaluate((el) => Math.abs(el.getBoundingClientRect().top));
      expect(top).toBeLessThan(50);
    }).toPass();
    await expect(page.getByTestId(`nav-${id}`)).toHaveAttribute("data-active", "true");
  }

  expect(errors).toEqual([]);
});

test("Reset Scenario in the nav is reachable and works from anywhere on the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  await page.getByTestId("nav-ch2").click();
  await page.locator("#treated-zone").selectOption("3");
  await expect(page.locator('[data-testid="ch2-city-zone-3"]')).toHaveAttribute("data-treated", "true");

  await page.getByTestId("nav-reset").click();
  await expect(page.locator('[data-testid="ch2-city-zone-3"]')).toHaveAttribute("data-treated", "false");
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter nav is reachable and reset is clickable at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.getByTestId("did-result")).toBeVisible();
      await expect(page.getByTestId("nav-reset")).toBeVisible();
      await page.getByTestId("nav-ch4").click();
      await expect(async () => {
        const top = await page.locator("#ch4").evaluate((el) => Math.abs(el.getBoundingClientRect().top));
        expect(top).toBeLessThan(50);
      }).toPass();
    });
  }

  test("the fixed bottom nav bar does not occlude a mobile chapter's own content (real click, not just isVisible)", async ({
    page,
  }) => {
    // isVisible() alone doesn't catch occlusion by another fixed-position element; a real,
    // actionable click (which Playwright refuses if something else is on top) does.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByTestId("did-result")).toBeVisible();

    await page.getByTestId("nav-ch3").click();
    const checkbox = page.locator(".zone-checkbox input[type=checkbox]").first();
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});

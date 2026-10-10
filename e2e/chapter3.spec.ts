import { expect, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

async function scrollToChapter3(page: Page) {
  const ch3Top = await page.locator("#ch3").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch3Top + 50);
}

test("chapter 3 hosts CTY-INT-003, with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await scrollToChapter3(page);
  await expect(page.getByTestId("chapter-3")).toBeVisible();
  await expect(page.getByTestId("ch3-city-stage")).toBeVisible();
  await expect(page.locator('[role="group"][aria-label="Control pool zone selection"]')).toBeVisible();

  expect(errors).toEqual([]);
});

test("checking a control-pool zone highlights it blue on chapter 3's own stage, a real comparative tie-in", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter3(page);
  await expect(page.getByTestId("ch3-city-stage")).toBeVisible();

  const checkbox = page.locator(".zone-checkbox input[type=checkbox]").first();
  await checkbox.click();

  const checkedLabel = page.locator(".zone-checkbox:has(input:checked)").first();
  const zoneNumber = (await checkedLabel.textContent())?.trim();
  const fill = await page
    .locator(`[data-testid="ch3-city-zone-${zoneNumber}"] .zone-block`)
    .evaluate((el) => getComputedStyle(el).fill);
  expect(fill).toBe("rgb(75, 132, 197)"); // --accent-blue, #4B84C5
});

test("state set in chapter 3 (control pool) is reflected in the lab's DiD estimate further down", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter3(page);
  const before = await page.evaluate(() => document.querySelector('[data-testid="att-value"]')?.textContent ?? "");

  await page.locator(".zone-checkbox input[type=checkbox]").first().click();

  await scrollTo(page, 100000);
  await expect(page.getByTestId("did-result")).toBeInViewport({ ratio: 0 });
  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter 3 fits without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await scrollToChapter3(page);
      await expect(page.getByTestId("ch3-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

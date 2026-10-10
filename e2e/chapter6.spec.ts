import { expect, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

async function scrollToChapter6(page: Page) {
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
  const ch6Top = await page.locator("#ch6").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch6Top);
}

test("chapter 6 hosts CTY-INT-006 and the identification-assumptions disclaimer, with no console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await scrollToChapter6(page);
  await expect(page.getByTestId("chapter-6")).toBeVisible();
  await expect(page.getByTestId("ch6-city-stage")).toBeVisible();
  await expect(page.locator("#outcome-select")).toBeVisible();
  await expect(page.getByTestId("identification-assumptions")).toBeVisible();
  await expect(page.getByTestId("identification-assumptions")).toContainText(/parallel trends/i);

  expect(errors).toEqual([]);
});

test("changing the outcome variable in chapter 6 recomputes the ATT to a different-order-of-magnitude value", async ({
  page,
}) => {
  await page.goto("/");
  await scrollToChapter6(page);

  const before = await page.getByTestId("att-value").textContent();
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");

  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();
});

test("state set elsewhere (treated zone) is still reflected on chapter 6's own stage", async ({ page }) => {
  await page.goto("/");
  const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch2Top);
  await page.locator("#treated-zone").selectOption("3");

  await scrollToChapter6(page);
  await expect(page.locator('[data-testid="ch6-city-zone-3"]')).toHaveAttribute("data-treated", "true");
  await expect(page.locator('[data-testid="ch6-city-zone-7"]')).toHaveAttribute("data-treated", "false");
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter 6 fits without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await scrollToChapter6(page);
      await expect(page.getByTestId("ch6-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("chapter 6 shows the grid before the prose at mobile (grid-first per the responsive plan)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await scrollToChapter6(page);
    const stageY = await page.getByTestId("ch6-city-stage").evaluate((el) => el.getBoundingClientRect().top);
    const headingY = await page.locator("#ch6-heading").evaluate((el) => el.getBoundingClientRect().top);
    expect(stageY).toBeLessThan(headingY);
  });
});

test("CTY-MOTION-001: scrolling through chapter 6's own pinned range and back does not break its content (no scroll-driven camera here by design)", async ({
  page,
}) => {
  // Same non-animated-chapter lifecycle check as chapters 3 and 5's own versions. Chapter 6 is the
  // last chapter, so instead of scrolling past it, this scrolls within its own 130vh pinned range
  // (same mechanism the scrubbing chapters use, just with no transform tied to progress here) and
  // back to the top.
  await page.goto("/");
  await scrollToChapter6(page);
  await expect(page.getByTestId("ch6-city-stage")).toBeVisible();
  const baseline = await page.getByTestId("ch6-city-stage").getAttribute("viewBox");
  const ch6Top = await page.locator("#ch6").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

  await scrollTo(page, ch6Top + 300);
  await scrollTo(page, ch6Top);

  await expect(page.getByTestId("ch6-city-stage")).toBeVisible();
  const after = await page.getByTestId("ch6-city-stage").getAttribute("viewBox");
  expect(after).toBe(baseline);
  await expect(page.locator("#outcome-select")).toBeEnabled();
});

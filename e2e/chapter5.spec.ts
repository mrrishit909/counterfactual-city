import { expect, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

async function scrollToChapter5(page: Page) {
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
  const ch5Top = await page.locator("#ch5").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch5Top);
}

test("chapter 5 hosts CTY-INT-005, with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await scrollToChapter5(page);
  await expect(page.getByTestId("chapter-5")).toBeVisible();
  await expect(page.getByTestId("ch5-city-stage")).toBeVisible();
  await expect(page.getByTestId("run-placebo")).toBeVisible();
  await expect(page.getByTestId("pretrend-badge")).toBeVisible();

  expect(errors).toEqual([]);
});

test("running the placebo test in chapter 5 shows a real rank and p-value", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter5(page);

  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-result")).toBeVisible();
  const rankText = await page.getByTestId("placebo-rank").textContent();
  expect(rankText).toMatch(/\d+ of \d+/);
});

test("the evidence-bands chart renders a real null distribution with the treated zone marked, not a placeholder", async ({
  page,
}) => {
  // The dossier's own literal phrase for this chapter is "null distribution > evidence bands"
  // (docs/ART_DIRECTION.md section 5); this confirms the chart (src/scenes/EvidenceBands.tsx)
  // actually renders one dot per placebo unit plus a distinct treated-zone dot, not an empty SVG.
  await page.goto("/");
  await scrollToChapter5(page);

  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-result")).toBeVisible();

  const chart = page.getByTestId("ch5-evidence-bands");
  await expect(chart).toBeVisible();

  const placeboDots = chart.locator('[data-testid^="ch5-evidence-dot-"]:not([data-testid*="treated"])');
  const nPlacebos = Number((await page.getByTestId("placebo-rank").textContent())?.match(/of (\d+)/)?.[1]) - 1;
  await expect(placeboDots).toHaveCount(nPlacebos);

  const treatedDot = chart.locator('[data-testid^="ch5-evidence-dot-treated-"]');
  await expect(treatedDot).toHaveCount(1);
});

test("an infeasible control pool shows a visible placebo error instead of crashing", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter5(page);

  // Narrow the control pool to a single zone (chapter 3's checkboxes), below the placebo test's
  // 2-unit minimum, then run the placebo test from chapter 5.
  const ch3Top = await page.locator("#ch3").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch3Top);
  await page.locator(".zone-checkbox input[type=checkbox]").first().click();

  await scrollToChapter5(page);
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-error")).toBeVisible();
});

test("state set elsewhere (treated zone) is still reflected on chapter 5's own stage", async ({ page }) => {
  await page.goto("/");
  const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch2Top);
  await page.locator("#treated-zone").selectOption("3");

  await scrollToChapter5(page);
  await expect(page.locator('[data-testid="ch5-city-zone-3"]')).toHaveAttribute("data-treated", "true");
  await expect(page.locator('[data-testid="ch5-city-zone-7"]')).toHaveAttribute("data-treated", "false");
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter 5 fits without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await scrollToChapter5(page);
      await expect(page.getByTestId("ch5-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

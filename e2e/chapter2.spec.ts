import { expect, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

async function scrollToChapter2(page: Page) {
  // Wait for document height to stabilize before measuring: with 3+ chapters each mounting their
  // own CityStage, ScrollTrigger's own post-load refresh can still be resizing/re-measuring
  // triggers for a few frames after `load`, and measuring #ch2's position mid-resize produces a
  // stale target that a later refresh invalidates (confirmed via git-stash repro: flaky only
  // under worker contention, passing every time once this settle wait is in).
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
  const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch2Top);
}

test("chapter 2 hosts CTY-INT-001 and CTY-INT-002, with no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await scrollToChapter2(page);
  await expect(page.getByTestId("chapter-2")).toBeVisible();
  await expect(page.getByTestId("ch2-city-stage")).toBeVisible();
  await expect(page.locator("#intervention-day")).toBeVisible();
  await expect(page.locator("#treated-zone")).toBeVisible();

  expect(errors).toEqual([]);
});

test("changing the treated zone in chapter 2 reframes chapter 2's own city stage", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter2(page);
  await expect(page.getByTestId("ch2-city-stage")).toBeVisible();

  await page.locator("#treated-zone").selectOption("3");

  await expect(page.locator('[data-testid="ch2-city-zone-3"]')).toHaveAttribute("data-treated", "true");
  await expect(page.locator('[data-testid="ch2-city-zone-7"]')).toHaveAttribute("data-treated", "false");
});

test("chapter 2's own camera reframes on scroll, independent of the intro's stage", async ({ page }) => {
  await page.goto("/");
  const ch2Stage = page.getByTestId("ch2-city-stage");
  await scrollToChapter2(page);
  await expect(ch2Stage).toBeVisible();

  const baseViewBox = await ch2Stage.getAttribute("viewBox");
  const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch2Top + 400); // partway through chapter 2's own scrub range
  await page.waitForTimeout(1300); // let the scrubbed (1s ease) transform settle

  const scrolledViewBox = await ch2Stage.getAttribute("viewBox");
  expect(scrolledViewBox).not.toBe(baseViewBox);
});

test("state set in chapter 2 (treated zone) is reflected in the DiD result right there in chapter 2", async ({
  page,
}) => {
  // Stage 4 lab integration: the DiD result (previously a standalone "Lab" section at the very
  // bottom of the page) now lives inside chapter 2 itself, next to CTY-INT-001/002, the controls
  // that drive it (src/scenes/DiDResultPanel.tsx), so this is no longer a "scroll far away and
  // check it updated" test, it's "the result is right here."
  await page.goto("/");
  await scrollToChapter2(page);
  const before = await page.getByTestId("att-value").textContent();

  await page.locator("#treated-zone").selectOption("3");

  await expect(page.getByTestId("did-result")).toBeInViewport({ ratio: 0 });
  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();
  await expect(page.getByTestId("estimator-error")).toHaveCount(0);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("chapter 2's stage lands directly on the framed, zoomed-in treated-zone view", async ({ page }) => {
    await page.goto("/");
    const ch2Stage = page.getByTestId("ch2-city-stage");
    await scrollToChapter2(page);
    await expect(ch2Stage).toBeVisible();
    const viewBox = await ch2Stage.getAttribute("viewBox");
    const [, , w] = (viewBox ?? "").split(" ").map(Number);
    // Zoomed view has a narrower viewBox width than the full grid (VIEWBOX_WIDTH, see
    // src/scenes/cityLayout.ts); confirms the reduced-motion branch actually ran rather than
    // leaving the stage at its default, unzoomed state.
    expect(w).toBeLessThan(636);
  });
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter 2 fits without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await scrollToChapter2(page);
      await expect(page.getByTestId("ch2-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

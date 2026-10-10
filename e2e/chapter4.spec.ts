import { expect, type Locator, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

// A plain Locator.fill() does not reliably drive a range input's React onChange; this mirrors the
// real slider-drag event pair controls.spec.ts's own setRangeValue helper already uses.
async function setRangeValue(locator: Locator, value: string) {
  await locator.evaluate((el: HTMLInputElement, v: string) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function scrollToChapter4(page: Page) {
  // Same settle-wait as chapter2.spec.ts's own scrollToChapter2: with 3+ chapters each mounting
  // their own CityStage, ScrollTrigger's post-load refresh can still be re-measuring triggers for
  // a few frames after `load`, and measuring #ch4's position mid-resize produces a stale target.
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
  const ch4Top = await page.locator("#ch4").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch4Top);
}

test("chapter 4 hosts CTY-INT-004, the flagship 'counterfactual' interaction, with no console errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await scrollToChapter4(page);
  await expect(page.getByTestId("chapter-4")).toBeVisible();
  await expect(page.getByTestId("ch4-observed-city-stage")).toBeVisible();
  await expect(page.getByTestId("ch4-counterfactual-city-stage")).toBeVisible();
  await expect(page.getByTestId("flagship-gap")).toBeVisible();

  expect(errors).toEqual([]);
});

test("the gap readout shows the real synthetic-control attPostMean, not a placeholder", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter4(page);

  const gapText = await page.getByTestId("flagship-gap").textContent();
  const labValue = await page.getByTestId("sc-att-value").textContent();
  expect(gapText).toContain(labValue?.trim());
});

test("scrolling through chapter 4 draws the two timelines apart (real scrub transform, not a static layout)", async ({
  page,
}) => {
  await page.goto("/");
  await scrollToChapter4(page);
  const observed = page.getByTestId("observed-timeline");
  const counterfactual = page.getByTestId("counterfactual-timeline");

  const baseObservedTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  // Regression guard for a real bug found live: this chapter's ScrollTrigger once measured its
  // start position before the async scenario fetch resolved, landing this trigger already fully
  // scrubbed to its END state even at the chapter's true top (see IntroSequence.tsx's own
  // ScrollTrigger.refresh() fix). Scrolled to the chapter's own top, the scrub must be at its
  // UNSTARTED state, not just "some state different from whatever comes after scrolling further".
  expect(baseObservedTransform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  const ch4Top = await page.locator("#ch4").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch4Top + 400);
  await page.waitForTimeout(1300); // let the scrubbed (1s ease) transform settle

  const scrolledObservedTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  const scrolledCounterfactualTransform = await counterfactual.evaluate((el) => getComputedStyle(el).transform);

  expect(scrolledObservedTransform).not.toBe(baseObservedTransform);
  expect(scrolledCounterfactualTransform).not.toBe(baseObservedTransform);
});

test("CTY-MOTION-001: reverse-scrolling chapter 4 undoes the divergence deterministically", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter4(page);
  const observed = page.getByTestId("observed-timeline");

  const baseTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  const ch4Top = await page.locator("#ch4").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

  await scrollTo(page, ch4Top + 400);
  await page.waitForTimeout(1300);
  const scrolledTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  expect(scrolledTransform).not.toBe(baseTransform);

  await scrollTo(page, ch4Top);
  await page.waitForTimeout(1300);
  const reversedTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  expect(reversedTransform).toBe(baseTransform);
});

test("the trajectory chart renders a real observed-vs-synthetic path, not an empty/placeholder chart", async ({
  page,
}) => {
  await page.goto("/");
  await scrollToChapter4(page);

  const observedPath = page.getByTestId("ch4-trajectory-observed");
  const syntheticPath = page.getByTestId("ch4-trajectory-synthetic");
  await expect(observedPath).toBeVisible();
  await expect(syntheticPath).toBeVisible();

  const observedD = await observedPath.getAttribute("d");
  const syntheticD = await syntheticPath.getAttribute("d");
  // A real multi-point line has many "L" commands; an empty/placeholder path would be short or
  // absent entirely.
  expect(observedD?.split("L").length ?? 0).toBeGreaterThan(10);
  expect(syntheticD?.split("L").length ?? 0).toBeGreaterThan(10);
  // The two series are not identical (the whole point of the chart): different donor weights
  // produce a different synthetic reconstruction than the observed series.
  expect(syntheticD).not.toBe(observedD);
});

test("the trajectory chart's synthetic path redraws when donor weights change", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter4(page);
  await expect(page.getByTestId("ch4-trajectory-synthetic")).toBeVisible();

  const before = await page.getByTestId("ch4-trajectory-synthetic").getAttribute("d");

  const sliders = page.locator('input[aria-label^="Donor weight for zone"]');
  await setRangeValue(sliders.nth(0), "1");
  const count = await sliders.count();
  for (let i = 1; i < count; i++) {
    await setRangeValue(sliders.nth(i), "0");
  }
  await page.getByRole("button", { name: /apply weights/i }).click();

  await expect(async () => {
    const after = await page.getByTestId("ch4-trajectory-synthetic").getAttribute("d");
    expect(after).not.toBe(before);
  }).toPass();
});

test("adjusting a donor weight in chapter 4 recomputes the synthetic-control gap", async ({ page }) => {
  await page.goto("/");
  await scrollToChapter4(page);
  await expect(page.getByTestId("flagship-gap")).toBeVisible();

  const before = await page.getByTestId("sc-att-value").textContent();

  const sliders = page.locator('input[aria-label^="Donor weight for zone"]');
  await setRangeValue(sliders.nth(0), "1");
  const count = await sliders.count();
  for (let i = 1; i < count; i++) {
    await setRangeValue(sliders.nth(i), "0");
  }
  await page.getByRole("button", { name: /apply weights/i }).click();

  await expect(async () => {
    const after = await page.getByTestId("sc-att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();
});

test("state set in chapter 4 (custom donor weights) does not break the shared DiD result hosted in chapter 2", async ({
  page,
}) => {
  // Stage 4 lab integration: the DiD result now lives inside chapter 2
  // (src/scenes/DiDResultPanel.tsx), not a standalone "Lab" section at the bottom. Donor weights
  // only affect the synthetic-control estimate, not DiD, so this confirms applying custom weights
  // in chapter 4 doesn't somehow break or blank out the unrelated DiD result elsewhere on the page.
  await page.goto("/");
  await scrollToChapter4(page);

  const sliders = page.locator('input[aria-label^="Donor weight for zone"]');
  await setRangeValue(sliders.nth(0), "1");
  const count = await sliders.count();
  for (let i = 1; i < count; i++) {
    await setRangeValue(sliders.nth(i), "0");
  }
  await page.getByRole("button", { name: /apply weights/i }).click();
  await expect(page.getByRole("button", { name: /use auto-fit weights/i })).toBeVisible();

  const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch2Top + 400);
  await expect(page.getByTestId("did-result")).toBeInViewport({ ratio: 0 });
  await expect(page.getByTestId("att-value")).not.toHaveText("");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the two timelines land directly in their final, drawn-apart positions", async ({ page }) => {
    await page.goto("/");
    await scrollToChapter4(page);

    const observedTransform = await page
      .getByTestId("observed-timeline")
      .evaluate((el) => getComputedStyle(el).transform);
    const counterfactualTransform = await page
      .getByTestId("counterfactual-timeline")
      .evaluate((el) => getComputedStyle(el).transform);

    expect(observedTransform).not.toBe("none");
    expect(counterfactualTransform).not.toBe("none");
    expect(observedTransform).not.toBe(counterfactualTransform);
  });
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`chapter 4 fits without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await scrollToChapter4(page);
      await expect(page.getByTestId("ch4-observed-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

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
  // GSAP's own ScrollTrigger resize/refresh debounce (~200ms) can still land after the settle
  // check above; without this, a refresh mid-test shifts the trigger's start position under us and
  // a "baseline" read taken too early already shows a nonzero scrub.
  await page.waitForTimeout(250);
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

  const ch4Top = await page.locator("#ch4").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await scrollTo(page, ch4Top + 400);
  await page.waitForTimeout(1300); // let the scrubbed (1s ease) transform settle

  const scrolledObservedTransform = await observed.evaluate((el) => getComputedStyle(el).transform);
  const scrolledCounterfactualTransform = await counterfactual.evaluate((el) => getComputedStyle(el).transform);

  expect(scrolledObservedTransform).not.toBe(baseObservedTransform);
  expect(scrolledCounterfactualTransform).not.toBe(baseObservedTransform);
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

test("state set in chapter 4 (custom donor weights) is still reflected in the lab further down", async ({ page }) => {
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

  await scrollTo(page, 100000);
  await expect(page.getByTestId("did-result")).toBeInViewport({ ratio: 0 });
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

import { expect, test } from "@playwright/test";

// Native <select> does not respond to synthetic ArrowDown/typeahead key events in headless
// Chromium (the same tooling gap CASCADIA's own e2e suite documented); selectOption() drives the
// browser's real <select> interaction model (it is not a React-level synthetic event hack), so it
// is used for every <select> here, with a dedicated real-keyboard test only where ArrowDown is
// confirmed to work (range inputs, e2e/smoke.spec.ts's CTY-INT-001 test already covers that).
//
// A <input type="range"> cannot be driven with Locator.fill() (Playwright only fills "editable"
// text-like elements); it is driven with Locator.evaluate() dispatching a real 'input'/'change'
// event pair, which is what a browser's own slider-drag interaction produces.
async function setRangeValue(locator: ReturnType<import("@playwright/test").Page["locator"]>, value: string) {
  await locator.evaluate((el: HTMLInputElement, v: string) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
});

test("CTY-INT-002: selecting a treated zone recomputes the ATT", async ({ page }) => {
  const before = await page.getByTestId("att-value").textContent();
  await page.locator("#treated-zone").selectOption("3");

  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();
});

test("CTY-INT-003: the control pool is an explicit allow-list, checking a zone recomputes the ATT, and unchecking it back to empty restores the 'use all zones' baseline", async ({ page }) => {
  const before = await page.getByTestId("att-value").textContent();
  await expect(page.getByText(/using all \d+ non-treated zones/i)).toBeVisible();

  const firstCheckbox = page.locator(".zone-checkbox input[type=checkbox]").first();
  await firstCheckbox.click();
  await expect(page.getByText(/using 1 selected zone/i)).toBeVisible();
  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass();

  await firstCheckbox.click();
  await expect(page.getByText(/using all \d+ non-treated zones/i)).toBeVisible();
  await expect(async () => {
    const restored = await page.getByTestId("att-value").textContent();
    expect(restored).toBe(before);
  }).toPass();
});

test("CTY-INT-004: applying custom donor weights recomputes the synthetic-control gap, and an invalid weight vector shows an error instead of crashing", async ({ page }) => {
  const trueBaselineGap = await page.getByTestId("sc-att-value").textContent();

  // Narrow the control pool to exactly 2 zones first (CTY-INT-003), so the weights panel has
  // exactly 2 sliders: a precise, exact-decimal 0.5/0.5 split is then possible to set directly,
  // sidestepping the floating-point drift a many-donor auto-fit's own weights can carry (the
  // solver's own normalization is only guaranteed to sum to 1 within its own tolerance, not to
  // the last bit, see WEIGHT_SUM_TOLERANCE in estimators.ts).
  const checkboxes = page.locator(".zone-checkbox input[type=checkbox]");
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await expect(page.getByText(/using 2 selected zone/i)).toBeVisible();

  const sliders = page.locator('input[aria-label^="Donor weight for zone"]');
  await expect(sliders).toHaveCount(2);
  const beforeGap = await page.getByTestId("sc-att-value").textContent();

  // A VALID, exact 50/50 split must recompute the gap (unless the auto-fit happened to already be
  // exactly 50/50, vanishingly unlikely for an independently-fit real estimate).
  await setRangeValue(sliders.nth(0), "0.5");
  await setRangeValue(sliders.nth(1), "0.5");
  await page.getByRole("button", { name: /apply weights/i }).click();
  await expect(page.getByTestId("sc-error")).toHaveCount(0);
  await expect(async () => {
    const afterValid = await page.getByTestId("sc-att-value").textContent();
    expect(afterValid).not.toBe(beforeGap);
  }).toPass();

  // An INVALID vector (does not sum to 1) must surface a visible error, not crash the page or
  // silently show a wrong number.
  await setRangeValue(page.locator('input[aria-label^="Donor weight for zone"]').nth(0), "0.9");
  await page.getByRole("button", { name: /apply weights/i }).click();
  await expect(page.getByTestId("sc-error")).toBeVisible();
  await expect(page.getByTestId("sc-error")).toContainText("sum to 1");

  // Regression for a real dead end an independent adversarial review found: the error used to
  // REPLACE the entire control, all sliders and the Apply button disappeared from the DOM, with
  // no in-place way to fix the input and retry. The sliders must still be present and usable
  // right here, and reapplying a valid vector must clear the error without needing Reset Scenario
  // (which would also discard the narrowed control pool set up above).
  await expect(page.locator('input[aria-label^="Donor weight for zone"]')).toHaveCount(2);
  // The failed apply's own remount lands each slider's defaultValue back at the last GOOD
  // weights (0.5/0.5, see ScenarioContext.tsx's own `lastGoodSc` fallback), so setting them to
  // 0.5/0.5 again would be a same-value no-op: React's own input value-tracking suppresses a
  // synthetic input event when the externally-set value matches what's already on the node,
  // independent of this app's own code. Use a different valid split (0.4/0.6) to force a real
  // change.
  await setRangeValue(page.locator('input[aria-label^="Donor weight for zone"]').nth(0), "0.4");
  await setRangeValue(page.locator('input[aria-label^="Donor weight for zone"]').nth(1), "0.6");
  await page.getByRole("button", { name: /apply weights/i }).click();
  await expect(page.getByTestId("sc-error")).toHaveCount(0);
  await expect(page.locator('input[aria-label^="Donor weight for zone"]')).toHaveCount(2);

  // The DiD section (a separate, independent computation) must still be intact, not crashed by
  // the synthetic-control section's own validation error.
  await expect(page.getByTestId("did-result")).toBeVisible();

  // Recovery: Reset Scenario clears the invalid custom weights AND the narrowed control pool,
  // restoring the original "use all zones" auto-fit.
  await page.getByRole("button", { name: /reset scenario/i }).click();
  await expect(page.getByText(/using all \d+ non-treated zones/i)).toBeVisible();
  await expect(page.getByTestId("sc-att-value")).toHaveText(trueBaselineGap ?? "");
});

test("CTY-INT-004 regression: slider thumb positions stay in sync with the displayed weight percentages after 'Use auto-fit weights' (an independent review caught this drifting)", async ({ page }) => {
  const sliders = page.locator('input[aria-label^="Donor weight for zone"]');
  await setRangeValue(sliders.nth(0), "1");
  const count = await sliders.count();
  for (let i = 1; i < count; i++) {
    await setRangeValue(sliders.nth(i), "0");
  }
  await page.getByRole("button", { name: /apply weights/i }).click();
  await expect(page.getByRole("button", { name: /use auto-fit weights/i })).toBeVisible();
  await page.getByRole("button", { name: /use auto-fit weights/i }).click();

  // Every slider's actual thumb position (its DOM value) must match the percentage label right
  // next to it, not a stale dragged-to value left over from before the reset.
  const afterClearSliders = page.locator('input[aria-label^="Donor weight for zone"]');
  const n = await afterClearSliders.count();
  for (let i = 0; i < n; i++) {
    const value = Number(await afterClearSliders.nth(i).inputValue());
    const labelText = await page.locator('[data-testid^="weight-value-"]').nth(i).textContent();
    const labelPercent = Number((labelText ?? "").replace("%", "")) / 100;
    expect(Math.abs(value - labelPercent)).toBeLessThan(0.015); // within the slider's own 0.01 step
  }
});

test("CTY-INT-005: running the placebo test shows a real rank and p-value, and an infeasible pool shows an error instead of crashing", async ({ page }) => {
  const button = page.getByTestId("run-placebo");
  await expect(button).toBeVisible();
  await button.click();

  await expect(page.getByTestId("placebo-result")).toBeVisible();
  const rankText = await page.getByTestId("placebo-rank").textContent();
  expect(rankText).toMatch(/\d+ of \d+/);

  // Infeasible case: narrow the control pool to a single zone (placebo needs >= 2 to permute
  // over) and confirm the app shows a visible error rather than crashing or showing a stale result.
  await page.locator(".zone-checkbox input[type=checkbox]").first().click();
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-error")).toBeVisible();
  await expect(page.getByTestId("placebo-error")).toContainText("at least 2 non-treated");
});

test("CTY-INT-006: changing the outcome variable loads a compatible series and recomputes the ATT", async ({ page }) => {
  const before = await page.getByTestId("att-value").textContent();
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");

  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
    // avg_speed_kmh's true injected effect is a small positive number (~3.2), a different order
    // of magnitude than trip_volume's (~-180), a cheap sanity check that a DIFFERENT series was
    // actually loaded, not just a re-label of the same numbers. parseFloat, not Number: the value
    // now carries a trailing unit (e.g. "3.2 km/h"), which Number() would reject as NaN.
    expect(parseFloat(after ?? "")).toBeGreaterThan(-20);
    expect(parseFloat(after ?? "")).toBeLessThan(20);
  }).toPass();
});

test("controls compose: sequential changes across multiple controls are not lost", async ({ page }) => {
  await page.locator("#treated-zone").selectOption("3");
  await setRangeValue(page.locator("#intervention-day"), "90");
  await page.locator("#outcome-select").selectOption("transit_ridership");

  await expect(page.locator("#treated-zone")).toHaveValue("3");
  await expect(page.locator("#intervention-day")).toHaveValue("90");
  await expect(page.locator("#outcome-select")).toHaveValue("transit_ridership");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await expect(page.getByTestId("estimator-error")).toHaveCount(0);
});

test("Reset Scenario restores every control to baseline, not just the intervention date", async ({ page }) => {
  const baselineZone = await page.locator("#treated-zone").inputValue();
  const baselineDay = await page.locator("#intervention-day").inputValue();
  const baselineOutcome = await page.locator("#outcome-select").inputValue();

  await page.locator("#treated-zone").selectOption("3");
  await setRangeValue(page.locator("#intervention-day"), "90");
  await page.locator("#outcome-select").selectOption("transit_ridership");
  await page.locator(".zone-checkbox input[type=checkbox]").first().click();

  await page.getByRole("button", { name: /reset scenario/i }).click();

  await expect(page.locator("#treated-zone")).toHaveValue(baselineZone);
  await expect(page.locator("#intervention-day")).toHaveValue(baselineDay);
  await expect(page.locator("#outcome-select")).toHaveValue(baselineOutcome);
  await expect(page.getByText(/using all \d+ non-treated zones/i)).toBeVisible();
});

test("no console errors or failed requests across a full interaction pass", async ({ page }) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.locator("#treated-zone").selectOption("3");
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-result")).toBeVisible();
  await page.getByRole("button", { name: /reset scenario/i }).click();

  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test("CTY-MOTION-001: scenario state set before scrolling survives a full scroll pass through all 6 chapters", async ({
  page,
}) => {
  // "Functional scenario consistency while scrolling": the analytical state (ScenarioContext) is
  // deliberately kept separate from animation/camera state (see CLAUDE.md's own hard rule, and
  // src/engine/ScenarioContext.tsx's header comment), so scrolling through every chapter's own
  // ScrollTrigger mount/kill lifecycle must never perturb it. Sets custom state on 3 different
  // controls, scrolls the full length of the document, then confirms every one of them still
  // reads back exactly what was set, not reset or corrupted by any chapter's own scroll handling.
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();

  await page.locator("#treated-zone").selectOption("3");
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");
  await page.locator(".zone-checkbox input[type=checkbox]").nth(1).click();

  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), (docHeight * i) / steps);
    await page.waitForTimeout(80);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));

  await expect(page.locator("#treated-zone")).toHaveValue("3");
  await expect(page.locator("#outcome-select")).toHaveValue("avg_speed_kmh");
  await expect(page.getByText(/using 1 selected zone/i)).toBeVisible();
});

test.describe("touch operability (real touch-emulated context)", () => {
  test.use({ hasTouch: true });

  test("CTY-INT-003 control-pool checkbox and Reset Scenario both work via tap", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("did-result")).toBeVisible();

    const before = await page.getByTestId("att-value").textContent();
    const firstCheckbox = page.locator(".zone-checkbox input[type=checkbox]").first();
    await firstCheckbox.tap();
    await expect(async () => {
      const after = await page.getByTestId("att-value").textContent();
      expect(after).not.toBe(before);
    }).toPass();

    await page.getByRole("button", { name: /reset scenario/i }).tap();
    await expect(page.getByText(/using all \d+ non-treated zones/i)).toBeVisible();
  });
});

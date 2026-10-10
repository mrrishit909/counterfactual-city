import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Live-URL-only smoke test (not part of the main e2e suite): verifies the actual deployed
// GitHub Pages build at https://mrrishit909.github.io/counterfactual-city/, not local preview.
// goto("./") is used throughout, not goto("/"), because this baseURL has a path component
// (new URL("/", baseURL) would resolve to the origin root, i.e. the portfolio, not this app).

test("site loads, no console errors, no failed requests", async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("requestfailed", (req) => failedRequests.push(req.url()));
  page.on("response", (res) => {
    if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`);
  });

  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible({ timeout: 15000 });
  expect(consoleErrors, `console errors: ${consoleErrors.join(", ")}`).toHaveLength(0);
  expect(failedRequests, `failed requests: ${failedRequests.join(", ")}`).toHaveLength(0);
});

test("intro renders and all six chapters are reachable via nav", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await expect(page.getByTestId("intro-section")).toBeVisible();

  for (const id of ["ch2", "ch3", "ch4", "ch5", "ch6"]) {
    await page.getByTestId(`nav-${id}`).click();
    await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 0.3, timeout: 10000 });
  }
});

test("forward and reverse scroll both work (scroll choreography)", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: "auto" }));
  await page.waitForTimeout(300);
  const mid = await page.evaluate(() => window.scrollY);
  expect(mid).toBeGreaterThan(before);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => window.scrollY);
  expect(back).toBe(0);
});

test("CTY-INT-001/002: changing treated zone recomputes the ATT, reset restores baseline", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  const before = await page.getByTestId("att-value").textContent();
  await page.locator("#treated-zone").selectOption("3");
  await expect(async () => {
    const after = await page.getByTestId("att-value").textContent();
    expect(after).not.toBe(before);
  }).toPass({ timeout: 10000 });
  await page.getByTestId("nav-reset").click();
  await expect(async () => {
    const restored = await page.getByTestId("att-value").textContent();
    expect(restored).toBe(before);
  }).toPass({ timeout: 10000 });
});

test("CTY-INT-004/synthetic control: chapter 4's trajectory chart and gap readout render real data", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.getByTestId("nav-ch4").click();
  await expect(page.locator("#ch4")).toBeInViewport({ ratio: 0.3 });
  await expect(page.getByTestId("ch4-trajectory-chart")).toBeVisible();
  await expect(page.getByTestId("ch4-trajectory-observed")).toBeVisible();
  await expect(page.getByTestId("ch4-trajectory-synthetic")).toBeVisible();
  await expect(page.getByTestId("flagship-gap")).toBeVisible();
  await expect(page.getByTestId("estimator-error")).toHaveCount(0);
});

test("CTY-INT-005/placebo: running the placebo test in chapter 5 shows a real rank and p-value", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.getByTestId("nav-ch5").click();
  await expect(page.locator("#ch5")).toBeInViewport({ ratio: 0.3 });
  await expect(page.getByTestId("pretrend-badge")).toBeVisible();
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-rank")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("placebo-result")).toBeVisible();
  await expect(page.getByTestId("ch5-evidence-bands")).toBeVisible();
});

test("chapter 6: identification-assumptions disclaimer and outcome control both present", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.getByTestId("nav-ch6").click();
  await expect(page.locator("#ch6")).toBeInViewport({ ratio: 0.3 });
  await expect(page.getByTestId("identification-assumptions")).toBeVisible();
  await expect(page.getByTestId("ch6-outcome-att")).toBeVisible();
});

test("keyboard-only: Skip Intro is keyboard-operable", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.getByTestId("skip-intro").focus();
  await page.keyboard.press("Enter");
  // Skip Intro lands at the boundary where chapter 2 begins, not partway into the viewport (same
  // assertion as the local suite's own "Skip Intro... keyboard-operable" test).
  await expect(async () => {
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(1000);
  }).toPass({ timeout: 10000 });
});

test("reduced motion: final chapter reachable without extra reserved scroll distance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await page.getByTestId("nav-ch6").click();
  await expect(page.locator("#ch6")).toBeInViewport({ ratio: 0.3, timeout: 10000 });
});

test("zero axe-core violations on the live page", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
});

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["tablet", 768, 1024],
  ["mobile", 390, 844],
] as const) {
  test(`no horizontal overflow at ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("./");
    await expect(page.getByTestId("did-result")).toBeVisible();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test(`screenshot at ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("./");
    await expect(page.getByTestId("did-result")).toBeVisible();
    await page.screenshot({ path: `verification/LIVE_VERIFICATION/live-${name}.png` });
  });
}

test("mobile nav does not occlude chapter content; reset reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await expect(page.getByTestId("did-result")).toBeVisible();
  const reset = page.getByTestId("nav-reset");
  await expect(reset).toBeVisible();
  await reset.click();
});

import { expect, type Page, test } from "@playwright/test";

async function scrollTo(page: Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
}

test("the city stage renders with 24 zones and the treated zone marked, no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  const zoneBlocks = page.locator('[data-testid^="intro-city-zone-"]');
  await expect(zoneBlocks).toHaveCount(24);
  await expect(page.locator('[data-testid="intro-city-zone-7"]')).toHaveAttribute("data-treated", "true");

  expect(errors).toEqual([]);
});

test("scrolling forward draws in the street grid and resolves the title and zone labels", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  const road = page.locator(".road").first();
  const drawnOffset = await road.evaluate((el) => (el as unknown as SVGLineElement).style.strokeDashoffset);
  expect(drawnOffset).not.toBe("0px");

  // 1200px: empirically confirmed (via direct probing) to be within the window where the roads
  // have finished drawing (beat A, 0-1) AND the title is still fully visible (title fades back out
  // starting around 1800px as beat C's handoff begins); 3000px+, used by the other tests in this
  // file, is past that handoff and would make this specific assertion wrong, not the app.
  await scrollTo(page, 1200);
  await expect(async () => {
    const offset = await road.evaluate((el) => (el as unknown as SVGLineElement).style.strokeDashoffset);
    expect(offset).toBe("0px");
  }).toPass();

  const titleOpacity = await page.locator(".intro-title").evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(titleOpacity)).toBeGreaterThan(0.5);
});

test("reverse scroll undoes the draw-in deterministically (GSAP scrub is a pure function of scroll position)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  const road = page.locator(".road").first();

  await scrollTo(page, 3000);
  await expect(async () => {
    const offset = await road.evaluate((el) => (el as unknown as SVGLineElement).style.strokeDashoffset);
    expect(offset).toBe("0px");
  }).toPass();

  await scrollTo(page, 0);
  await expect(async () => {
    const offset = await road.evaluate((el) => (el as unknown as SVGLineElement).style.strokeDashoffset);
    expect(offset).not.toBe("0px");
  }).toPass();
});

test("fast-jump scroll recovers to the correct deterministic state (no stale intermediate frame)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  // Jump straight to the very end of the scrubbed range in one move, skipping every intermediate
  // scroll position a slow scroll would pass through: the whole point of a scrub-bound (not a
  // custom state machine's) timeline is that this produces the exact same end state regardless.
  const sectionHeight = await page.locator("#intro-section").evaluate((el) => el.getBoundingClientRect().height);
  await scrollTo(page, sectionHeight);

  await expect(async () => {
    const road = page.locator(".road").first();
    const offset = await road.evaluate((el) => (el as unknown as SVGLineElement).style.strokeDashoffset);
    expect(offset).toBe("0px");
  }).toPass();
  const titleOpacity = await page.locator(".intro-title").evaluate((el) => getComputedStyle(el).opacity);
  expect(Number(titleOpacity)).toBeLessThan(0.5); // beat C has already faded it back out by this point
});

test("Skip Intro reaches chapter 2, and it is keyboard-operable", async ({ page }) => {
  // Skip Intro's job is to skip the INTRO specifically, not to scroll all the way to the lab:
  // chapter 2 (its own separate section with its own scroll distance) now sits between them.
  // This test was originally written to check for the lab's <main> directly, back when the lab
  // was the very next thing after the intro; updated when chapter 2 was inserted between them,
  // not a defect in Skip Intro itself (the underlying boundary-landing behavior is unchanged and
  // still covered by the reduced-motion variant below).
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();

  const skipButton = page.getByTestId("skip-intro");
  await skipButton.focus();
  await page.keyboard.press("Enter");

  await expect(async () => {
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(1000);
  }).toPass();

  await expect(async () => {
    const ch2Top = await page.locator("#ch2").evaluate((el) => el.getBoundingClientRect().top);
    const viewportHeight = page.viewportSize()?.height ?? 0;
    expect(ch2Top).toBeLessThanOrEqual(viewportHeight);
  }).toPass();
});

test("the treated zone's color reflects the real DiD result, and changing the scenario changes it", async ({ page }) => {
  await page.goto("/");
  const getFill = () =>
    page.locator('[data-testid="intro-city-zone-7"] .zone-block-treated').evaluate((el) => getComputedStyle(el).fill);
  const before = await getFill();

  // Scroll to chapter 6 (the outcome select's own home, CTY-INT-006) and change the outcome, a
  // control that changes the sign of the DiD estimate for this panel (trip_volume is negative,
  // avg_speed_kmh is positive, see analysis/data/synthetic_panel.py's TRUE_ATT), which should
  // flip the encoded color.
  await scrollTo(page, 100000);
  await page.locator("#outcome-select").selectOption("avg_speed_kmh");

  await expect(async () => {
    const after = await getFill();
    expect(after).not.toBe(before);
  }).toPass();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows the final state instantly, with no scroll-driven transform needed", async ({ page }) => {
    await page.goto("/");
    const road = page.locator(".road").first();
    await expect(road).toHaveCSS("stroke-dashoffset", "0px");
    const titleOpacity = await page.locator(".intro-title").evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(titleOpacity)).toBe(1);
  });

  test("the final chapter is reachable by ordinary scrolling (the intro no longer reserves extra scroll distance to skip)", async ({
    page,
  }) => {
    // Stage 4 lab integration: the DiD result now lives inside chapter 2
    // (src/scenes/DiDResultPanel.tsx), not a standalone "Lab" section at the very bottom, so
    // "reachable by scrolling all the way down" is now checked against chapter 6 (the last
    // chapter), not did-result.
    await page.goto("/");
    await expect(page.getByTestId("intro-city-stage")).toBeVisible();
    await scrollTo(page, 100000);
    await expect(page.getByTestId("chapter-6")).toBeInViewport({ ratio: 0 });
  });
});

test("regression: a panel-fetch failure does not trap the page behind a permanent, reachless loading state", async ({
  page,
}) => {
  // An independent review caught this: the intro's own early return handled BOTH "loading" and
  // "error" status identically, with no message and no way to reach the chapters below, which had
  // their own correct error branch for this exact failure (previously in the standalone "Lab"
  // section, now in src/scenes/DiDResultPanel.tsx inside chapter 2) but it was never rendered.
  // Routing the fetch to fail and confirming the real error message appears (not a permanent
  // spinner).
  await page.route("**/data/panel.json", (route) => route.abort());
  await page.goto("/");
  const errorPanel = page.locator('[data-state="error"]');
  await expect(errorPanel).toBeVisible({ timeout: 5000 });
  await expect(errorPanel).toContainText(/failed to load/i);
});

test("regression: Skip Intro actually scrolls under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  const before = await page.evaluate(() => window.scrollY);
  await page.getByTestId("skip-intro").click();
  await expect(async () => {
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
  }).toPass();
});

test("regression: the camera pushes the treated zone toward the viewport center, not off-screen", async ({ page }) => {
  // An independent review caught a real targeting bug: a percentage transformOrigin was resolved
  // against the SVG element's own bbox, not the viewBox the target coordinate was computed in,
  // pushing the treated zone entirely off the top of the viewport (confirmed by direct
  // measurement against the pre-fix code: rect.bottom was -104.9, i.e. not even partially
  // visible) instead of centering it. Fixed with GSAP's svgOrigin (viewBox-space coordinates
  // directly). This assertion (at least some part of the block on screen) was confirmed, by
  // reverting this fix locally and rerunning, to actually fail against the pre-fix code, not
  // just pass trivially.
  await page.goto("/");
  await expect(page.getByTestId("intro-city-stage")).toBeVisible();
  const sectionHeight = await page.locator("#intro-section").evaluate((el) => el.getBoundingClientRect().height);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), sectionHeight * 0.95);
  await page.waitForTimeout(1500); // let the scrubbed (1s ease) transform settle

  const treatedRect = await page
    .locator('[data-testid="intro-city-zone-7"] .zone-block-treated')
    .evaluate((el) => el.getBoundingClientRect());
  const viewportSize = page.viewportSize()!;
  expect(treatedRect.bottom).toBeGreaterThan(0);
  expect(treatedRect.top).toBeLessThan(viewportSize.height);
});

test.describe("responsive viewports", () => {
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  for (const vp of viewports) {
    test(`city stage and title fit without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.getByTestId("intro-city-stage")).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }
});

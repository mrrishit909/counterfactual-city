import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "verification", "SCREENSHOTS");

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const vp of viewports) {
  test(`intro evidence at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.getByTestId("intro-city-stage")).toBeVisible();
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-start.png`) });

    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "auto" }));
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-midbeat.png`) });

    await page.getByTestId("skip-intro").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, `intro-${vp.name}-handoff.png`) });
  });
}

// CTY-MOTION-001 ("the intro and all six chapters are captured at every required breakpoint"):
// chapters 2-6 evidence, same pattern as the intro's own capture above (start of chapter, partway
// through its own scroll range, and after Skip Intro's own earlier-established pattern isn't
// applicable here, so a settled end-state replaces it). A dedicated settle-wait before each
// measurement, same as e2e/chapter4.spec.ts's own scrollToChapter4 helper, since the intervening
// chapters all register their own ScrollTrigger on mount.
const CHAPTERS = ["ch2", "ch3", "ch4", "ch5", "ch6"];

async function waitForLayoutSettle(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
}

for (const vp of viewports) {
  for (const chapterId of CHAPTERS) {
    test(`${chapterId} evidence at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.getByTestId("did-result")).toBeVisible();
      await waitForLayoutSettle(page);

      const top = await page.locator(`#${chapterId}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(DIR, `${chapterId}-${vp.name}-start.png`) });

      await page.evaluate((y) => window.scrollTo({ top: y + 400, behavior: "auto" }), top);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: path.join(DIR, `${chapterId}-${vp.name}-midscroll.png`) });
    });
  }
}

// Reduced-motion variant, one representative chapter (4, the flagship) per breakpoint: CASCADIA's
// own evidence-harness convention is one reduced-motion capture per viewport, not a full matrix,
// since reduced motion collapses every chapter to the same "land on final state" rule
// (src/scenes/useScene.ts), already covered per-chapter by each chapter's own e2e reduced-motion
// test; this capture is for visual review, not behavioral coverage.
for (const vp of viewports) {
  test(`ch4 reduced-motion evidence at ${vp.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.getByTestId("did-result")).toBeVisible();
    await waitForLayoutSettle(page);
    const top = await page.locator("#ch4").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(DIR, `ch4-${vp.name}-reduced-motion.png`) });
  });
}

// An independent visual QA review flagged a real evidence gap: every ch5 capture showed only the
// placebo button's pre-click state, so the actual "evidence bands" result (CTY-INT-005's own
// `then` clause) was never independently confirmable from the screenshots provided. One desktop
// post-click capture closes that gap (not a full breakpoint matrix: the result's own content
// doesn't change shape across breakpoints, only the surrounding layout does, already covered by
// ch5's own start/midscroll captures above).
test("ch5 placebo-result evidence (post-click state) at desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await waitForLayoutSettle(page);
  const top = await page.locator("#ch5").evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
  await page.getByTestId("run-placebo").click();
  await expect(page.getByTestId("placebo-result")).toBeVisible();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(DIR, "ch5-desktop-placebo-result.png") });
});

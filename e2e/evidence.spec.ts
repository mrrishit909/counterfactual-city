import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "verification", "SCREENSHOTS");
// The committed evidence is Chromium's; Firefox/WebKit runs keep their screenshots in test-results.
const shotDir = () => (test.info().project.name === "chromium" ? DIR : test.info().outputDir);

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
    await page.screenshot({ path: path.join(shotDir(), `intro-${vp.name}-start.png`) });

    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: "auto" }));
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(shotDir(), `intro-${vp.name}-midbeat.png`) });

    await page.getByTestId("skip-intro").click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(shotDir(), `intro-${vp.name}-handoff.png`) });
  });
}

// CTY-MOTION-001's own wording ("the intro AND all six chapters ... reduced-motion variants
// tested") treats the intro as its own capture, separate from the numbered chapters below.
for (const vp of viewports) {
  test(`intro reduced-motion evidence at ${vp.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await expect(page.getByTestId("intro-city-stage")).toBeVisible();
    await page.screenshot({ path: path.join(shotDir(), `intro-${vp.name}-reduced-motion.png`) });
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
      await page.screenshot({ path: path.join(shotDir(), `${chapterId}-${vp.name}-start.png`) });

      await page.evaluate((y) => window.scrollTo({ top: y + 400, behavior: "auto" }), top);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: path.join(shotDir(), `${chapterId}-${vp.name}-midscroll.png`) });
    });
  }
}

// Reduced-motion variant for EVERY chapter at every breakpoint (CTY-MOTION-001's own full
// requirement), not just chapter 4: reduced motion collapses each chapter to its own "land on
// final state" rule (src/scenes/useScene.ts's own `reducedMotion` branch, or for chapters 3/5/6,
// simply the unchanged static camera since they have no scroll-driven transform to begin with),
// but that's a behavioral guarantee each chapter's own e2e reduced-motion test already checks;
// this is the actual visual evidence, for a human (or an independent reviewer) to look at.
for (const vp of viewports) {
  for (const chapterId of CHAPTERS) {
    test(`${chapterId} reduced-motion evidence at ${vp.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.getByTestId("did-result")).toBeVisible();
      await waitForLayoutSettle(page);
      const top = await page.locator(`#${chapterId}`).evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), top);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(shotDir(), `${chapterId}-${vp.name}-reduced-motion.png`) });
    });
  }
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
  await page.screenshot({ path: path.join(shotDir(), "ch5-desktop-placebo-result.png") });
});

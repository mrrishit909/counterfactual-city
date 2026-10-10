import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// CTY-MOTION-001's own full requirement ("actual scroll recordings and contact sheets", "real
// production-build frame-pacing measurements"), run against the SAME production preview build
// every other e2e test runs against (playwright.config.ts's own webServer: `npm run preview`, not
// a dev server). This is a reusable evidence-harness pattern (per the project's own
// PATTERNS.md/CLAUDE.md reference to a reusable evidence-harness script), implemented as a
// Playwright test rather than a separate CLI script to reuse the same browser/server lifecycle and
// avoid a second screenshot/compositing dependency: a contact sheet here is just an HTML grid of
// already-captured PNGs, screenshotted by Playwright itself, no new image library needed.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "verification", "SCREENSHOTS");
const FRAMES_DIR = path.join(DIR, "scroll-frames");
fs.mkdirSync(FRAMES_DIR, { recursive: true });

async function waitForLayoutSettle(page: Page) {
  await page.waitForFunction(() => {
    const h = document.documentElement.scrollHeight;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => resolve(document.documentElement.scrollHeight === h));
    });
  });
}

/** Scrolls through [top, top+range] in `steps` evenly-spaced positions, screenshotting the
 * viewport at each (a "scroll recording" as a frame sequence), and returns the saved file paths. */
async function recordScroll(page: Page, name: string, top: number, range: number, steps: number): Promise<string[]> {
  const files: string[] = [];
  for (let i = 0; i < steps; i++) {
    const y = top + (range * i) / (steps - 1);
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "auto" }), y);
    await page.waitForTimeout(150);
    const file = path.join(FRAMES_DIR, `${name}-frame-${String(i).padStart(2, "0")}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }
  return files;
}

/** Composes a contact sheet: a single image, grid of thumbnails, one per captured frame, by
 * building a plain HTML page referencing the frame files as local images and screenshotting it. */
async function buildContactSheet(page: Page, name: string, frameFiles: string[], cols = 4) {
  const imgs = frameFiles
    .map((f, i) => `<figure><img src="file://${f}" /><figcaption>${i}</figcaption></figure>`)
    .join("\n");
  const html = `<!doctype html><html><head><style>
    body { margin: 0; background: #f3f0e8; font-family: sans-serif; }
    .sheet { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 4px; padding: 8px; }
    figure { margin: 0; border: 1px solid #ccc; }
    img { width: 100%; display: block; }
    figcaption { text-align: center; font-size: 10px; padding: 2px; }
  </style></head><body><div class="sheet">${imgs}</div></body></html>`;
  const htmlPath = path.join(FRAMES_DIR, `${name}-contact-sheet.html`);
  fs.writeFileSync(htmlPath, html);
  const sheetPage = await page.context().newPage();
  await sheetPage.goto(`file://${htmlPath}`);
  await sheetPage.waitForTimeout(300);
  await sheetPage.screenshot({ path: path.join(DIR, `${name}-contact-sheet.png`), fullPage: true });
  await sheetPage.close();
}

for (const [name, selector, frames] of [
  ["intro", "#intro-section", 8],
  ["ch2", "#ch2", 6],
  ["ch4", "#ch4", 6],
] as const) {
  test(`scroll recording + contact sheet: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("did-result")).toBeVisible();
    await waitForLayoutSettle(page);

    const el = page.locator(selector);
    const { top, height } = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    // Scrub across the section's own pinned scroll range (height minus the 100vh sticky viewport
    // stays visible throughout), not past it.
    const range = Math.max(0, height - 900);

    const frameFiles = await recordScroll(page, name, top, range, frames);
    await buildContactSheet(page, name, frameFiles);

    for (const f of frameFiles) expect(fs.existsSync(f)).toBe(true);
    expect(fs.existsSync(path.join(DIR, `${name}-contact-sheet.png`))).toBe(true);
  });
}

/** Hooks requestAnimationFrame, scrolls continuously between two y positions over ~1.5s (a real
 * scroll pass, not a single jump), and returns the frame-time samples recorded during it. */
async function measureFrameTimesDuringScroll(page: Page, fromY: number, toY: number): Promise<number[]> {
  await page.evaluate(() => {
    (window as unknown as { __frameTimes: number[] }).__frameTimes = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      (window as unknown as { __frameTimes: number[] }).__frameTimes.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "auto" }), fromY + ((toY - fromY) * i) / steps);
    await page.waitForTimeout(50);
  }
  const frameTimes: number[] = await page.evaluate(
    () => (window as unknown as { __frameTimes: number[] }).__frameTimes,
  );
  // Drop the first sample (always 0 or an outlier from hook setup) and any zero-length warmup frames.
  return frameTimes.slice(1).filter((t) => t > 0);
}

function summarize(samples: number[]) {
  const mean = samples.reduce((s, t) => s + t, 0) / samples.length;
  const sorted = [...samples].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const droppedFrames = samples.filter((t) => t > 33.4).length; // worse than ~30fps for a frame
  return {
    sampleCount: samples.length,
    meanFrameTimeMs: Number(mean.toFixed(2)),
    p95FrameTimeMs: Number(p95.toFixed(2)),
    estimatedFps: Number((1000 / mean).toFixed(1)),
    droppedFrames60fpsBudget: droppedFrames,
  };
}

// Real production-build frame-pacing measurement for every chapter, not just chapter 4: hooks
// requestAnimationFrame to record actual frame timestamps during a real scrub-driven scroll pass
// forward AND in reverse, plus a genuinely idle baseline (no scrolling) for comparison, so a
// chapter's own real GSAP scrub animation is measured against real idle-page pacing rather than
// an invented number. The intro IS chapter "01 Observed world" in this app's own chapter numbering
// (ChapterNav.tsx), so it is measured once, not duplicated as a separate "chapter 1".
test("real frame-pacing measurement for every chapter, forward + reverse, with an idle baseline (production build)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByTestId("did-result")).toBeVisible();
  await waitForLayoutSettle(page);

  const idleSamples = await measureFrameTimesDuringScroll(page, 0, 0);

  const chapters = [
    ["intro", "#intro-section"],
    ["ch2", "#ch2"],
    ["ch3", "#ch3"],
    ["ch4", "#ch4"],
    ["ch5", "#ch5"],
    ["ch6", "#ch6"],
  ] as const;

  const report: Record<string, unknown> = {
    budget: "60fps desktop target (CLAUDE.md release gate): 16.7ms/frame mean; dropped = frame > 33.4ms (worse than 30fps)",
    measuredAgainst: "production build (vite preview), real continuous scroll, not an idle page",
    idleBaseline: summarize(idleSamples),
  };

  for (const [name, selector] of chapters) {
    const { top, height } = await page.locator(selector).evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    const range = Math.max(300, Math.min(height - 900, 1300));

    const forward = await measureFrameTimesDuringScroll(page, top, top + range);
    const reverse = await measureFrameTimesDuringScroll(page, top + range, top);

    report[name] = { forward: summarize(forward), reverse: summarize(reverse) };

    // Sanity bound per chapter (not a strict perf gate, a single CI machine's pacing varies with
    // host load): catches a genuinely broken animation (e.g. the ScrollTrigger measurement bug
    // this project found earlier, which would produce a frozen, all-zero or all-huge series).
    expect(forward.length, `${name} forward samples`).toBeGreaterThan(10);
    expect(reverse.length, `${name} reverse samples`).toBeGreaterThan(10);
  }

  fs.writeFileSync(path.join(DIR, "..", "FRAME_PACING.json"), JSON.stringify(report, null, 2));
});

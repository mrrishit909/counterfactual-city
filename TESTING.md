# Testing

## Suites and what they actually cover

| Suite | Command | Covers |
|---|---|---|
| Python oracle | `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/python -m pytest analysis/validation/ -q` | The reference DiD/synthetic-control/placebo/pretrend implementation, 25 golden + boundary cases. Source of truth for TS parity. An independent adversarial review found this was previously NOT reproducible from a clean checkout (`requirements.txt` didn't exist); fixed and re-verified against a genuinely fresh venv. |
| Vitest | `npx vitest run` | `src/engine/estimators.test.ts` (TS-vs-Python parity), `src/scenes/*.test.ts` (pure functions: `cityLayout`, `resultVisualEncoding`), `src/App.test.tsx` (`DiDResultPanel` + `InterventionDateControl` composition, jsdom-safe, no GSAP/ScrollTrigger). 35 tests total. |
| Playwright e2e | `npx playwright test` | Against the PRODUCTION PREVIEW build (`playwright.config.ts`'s own `webServer: npm run preview`), never a dev server. ~126 tests across the files below. |
| Typecheck | `npx tsc -b` |, |
| Lint | `npx oxlint` |, |

**2026-10-11 update (CI hardening):** Playwright now has Chromium, Firefox and WebKit projects
(`--project=<name>`): 128 tests per engine (384/384 passed locally across all three before the
evidence-harness skip below; Firefox/WebKit now skip its 4 tests); CI runs each engine as its own job and
the Pages deploy waits for all of them. The committed evidence stays Chromium's: the evidence
harness (contact sheets, `FRAME_PACING.json`) runs in Chromium only, and `evidence.spec.ts` /
`smoke.spec.ts` write their screenshots to `verification/SCREENSHOTS/` only in Chromium (other
engines write to `test-results/`). `PW_PORT=<port>` moves the preview off 4173.

Vitest deliberately does NOT render the full pinned `<App/>`: jsdom cannot correctly revert
`ScrollTrigger`'s own pin-spacer DOM restructuring on unmount. Scroll-pin behavior is exclusively a
Playwright concern, against a real browser.

## e2e file breakdown

- `smoke.spec.ts`, production build loads, shows a real result, keyboard-driven recompute, 3
  responsive breakpoints.
- `intro.spec.ts`, the 3-beat sequence, reverse scroll, fast-jump recovery, Skip Intro (keyboard +
  reduced motion), the treated-zone color reflecting the real DiD result, camera-centering regression
  guard, a panel-fetch-failure regression guard.
- `chapter2.spec.ts` / `chapter3.spec.ts` / `chapter4.spec.ts` / `chapter5.spec.ts` /
  `chapter6.spec.ts`, one file per chapter: layout, the chapter's own control(s), real recomputation,
  camera/motion behavior where applicable, reverse-scroll or non-animated-lifecycle checks, shared
  state with other chapters, responsive breakpoints, reduced motion.
- `controls.spec.ts`, all 6 controls' own CTY-INT-* acceptance criteria, cross-control composition,
  Reset Scenario, touch operability, functional scenario consistency across a full scroll pass.
- `chapterNav.spec.ts`, every nav link reaches its chapter and highlights correctly, Reset Scenario
  reachable from anywhere, mobile nav-bar occlusion checked with a REAL click (not just `isVisible()`,
  which does not detect occlusion by another fixed-position element).
- `a11y.spec.ts`, axe-core, baseline and after interacting with all 6 controls; every control has a
  programmatic label.
- `evidence.spec.ts`, real screenshots at all 3 breakpoints for the intro and all 5 numbered
  chapters, plus reduced-motion variants for all of them, plus a post-click placebo-result capture.
  Writes to `verification/SCREENSHOTS/`.
- `evidence-harness.spec.ts`, scroll recordings (a frame sequence through a section's own pinned
  range) composited into contact-sheet images, and a real frame-pacing measurement (hooked
  `requestAnimationFrame` during an actual scroll pass). Writes to
  `verification/SCREENSHOTS/scroll-frames/`, `verification/SCREENSHOTS/*-contact-sheet.png`, and
  `verification/FRAME_PACING.json`.

## Reproducing the evidence in `verification/`

```bash
npm run build
npx playwright test e2e/evidence.spec.ts e2e/evidence-harness.spec.ts
```

regenerates every screenshot, contact sheet, and the frame-pacing report against a fresh production
build. Per this project's own mandatory visual-QA rule (see `CLAUDE.md`), generating these images is
not sufficient on its own, they must actually be opened and reviewed. Several real defects in this
project (a mobile overflow bug, a chart collapsed to 1px tall, a global contrast regression) were
found this way, not by any automated assertion.

## Known flaky test class

`e2e/chapter2.spec.ts`'s own camera-reframe test and `e2e/chapter4.spec.ts`'s own divergence test
occasionally fail under heavy parallel CPU contention (multiple Playwright workers plus a 1-second
GSAP `scrub` ease competing for the same core), roughly 1 in 20-25 full-suite runs in local testing,
always passing in isolation. Not yet converted to `expect.poll`-based polling (a cleaner fix than the
current fixed-timeout waits); tracked here rather than silently tolerated.

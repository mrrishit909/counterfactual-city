# THE COUNTERFACTUAL CITY, Publication Report

Companion to `verification/RELEASE_ACCEPTANCE.md` (release-candidate evaluation),
`verification/INDEPENDENT_ADVERSARIAL_REVIEW.md` / `REMEDIATION_VERIFICATION.md` (pre-deployment
code review), and `LIMITATIONS.md`. This is the single consolidated record of publication: where
everything lives, what was checked, and by whom.

## Public URLs

| | URL |
|---|---|
| Live website | https://mrrishit909.github.io/counterfactual-city/ |
| GitHub repository | https://github.com/mrrishit909/counterfactual-city |
| Portfolio home | https://mrrishit909.github.io/projects/ |
| Case study | https://mrrishit909.github.io/projects/counterfactual-city/ |

## Deployment commit and workflow

- **Release-candidate commit:** `e4b65da`, tagged `release-candidate-e4b65da`.
- **Live build tracks `main` HEAD**: the deploy workflow runs on every push to `main`. Commits
  since the tag (`939d998` live-verification artifacts, `8472e86` requirements update) are docs
  and verification evidence only, no app source changed, so the deployed build is unchanged from
  the tagged release candidate. Last verified workflow run: `38083407131`, completed successfully.
- **Deployment workflow:** `.github/workflows/deploy.yml` (checkout, Node 24, `npm ci`,
  `tsc -b`, `oxlint`, `vitest`, `vite build`, `upload-pages-artifact`, `deploy-pages`), triggered
  on every push to `main`.
- **Base path:** `vite.config.ts`'s `base: '/counterfactual-city/'`, matching the GitHub Pages
  project-page URL. The panel-data fetch already built its URL from `import.meta.env.BASE_URL`,
  so no other code path needed to change for this.

## Pre-deployment performance preflight (closed a real gap before publishing)

Local Lighthouse against the base-path production build found desktop Performance 76 and CLS
0.802, a real defect, not accepted or worked around. Root-caused with a live
`PerformanceObserver` probe (not assumed from Lighthouse's own summary alone): chapter 2 is
always rendered regardless of the intro's data-loading state, so for ~140ms before the panel
fetch resolves it sits at the very top of the page; once ready, the 400vh cinematic intro mounts
above it and pushes it down, registering as chapter 2's own box collapsing to nothing in the
viewport. Fixed by reserving the same 400vh slot in the loading placeholder. Reverified: desktop
Performance 100 / Accessibility 100 / CLS 0.005; mobile Performance 100 / Accessibility 100 /
CLS 0. Frame pacing was also extended from chapter 4 only to every chapter, forward and reverse,
against a genuine idle baseline, all land at ~60fps, 0 dropped frames, indistinguishable from
idle. Full detail: `verification/FRAME_PACING.json`, `verification/PERFORMANCE/`.

## Live smoke-test results

First-party verification, a standalone 17-test Playwright pass against the actual public URL
(`verification/live_scratch/live.spec.ts`, not local preview): 17/17 PASS, load health (zero
console errors, zero failed/4xx+ requests), all 6 chapters reachable via nav, forward/reverse
scroll, CTY-INT-001/002 (treated zone + reset), CTY-INT-004 (chapter 4 trajectory chart, real
observed vs. synthetic paths), CTY-INT-005 (placebo test, evidence-bands chart), chapter 6
(identification-assumptions disclaimer, local outcome readout), keyboard operability, reduced
motion, zero axe-core violations, no horizontal overflow at 3 breakpoints, mobile nav
non-occlusion. Real screenshots captured and visually inspected. Full detail:
`verification/LIVE_VERIFICATION/LIVE_VERIFICATION_REPORT.md`.

## Lighthouse results (live public URL)

| | Desktop | Mobile |
|---|---|---|
| Performance | 100 | 100 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 90 | 90 |
| LCP | 0.3s | 1.5s |
| CLS | 0.005 | 0 |

All exceed the release gate (Performance ≥90, Accessibility ≥95, LCP ≤2.5s, CLS ≤0.1) with wide
margin, and match the local preflight numbers from the identical build exactly.

## Independent publication review (public-URL-only, no session access)

A separate worktree-isolated reviewer with no access to this session's notes, git log messages,
or internal docs inspected the public repo, the live app, and the portfolio/case-study pages
directly (curl + static asset/JS inspection; browser automation was not available to that
particular agent, so live-control interaction and axe-core were marked "not verified" by it
both are independently covered by this session's own 17-test live Playwright pass above, which
*did* drive the live controls and run axe-core against the real page).

**Findings:** zero P0, zero P1. One P2: the case-study prose is "unusually self-referential about
its own build process" in places (specific tolerance numbers, QA-process narration), "not
dishonest, but stylistically it undercuts polish." Not fixed (non-blocking, a style preference,
not a defect); left as an honest disclosure here rather than silently patched.

**Confirmed directly by that reviewer:** repo is public with real, non-squashed commit history;
`.github/workflows/deploy.yml` present on `main`; live Pages URL returns 200 and serves the real
hashed JS/CSS bundles; `data/panel.json` loads with real fixture metadata; all 6 chapters present
with real ARIA structure; Reset control present; the shipped JS contains real DiD/synthetic-
control/placebo computation with runtime validation (not frozen/static values); identification-
assumption caveats sit directly adjacent to every effect number; the case study's two links both
resolve to the correct live app and repo; the project is discoverable on the portfolio home page;
and (the most important honesty check) the synthetic-data disclosure is explicit and repeated
everywhere a number appears (the fixture's own metadata, the app's own UI copy, and the case
study all independently state this is a synthetic city, never real NYC data).

**Verdict: READY WITH DISCLOSED GAPS**, in that reviewer's own words, "a real, working,
honestly-labeled app, not a mockup."

## Remaining limitations (disclosed, not fixed)

- Case-study prose tone (P2 above): reads a little build-diary-ish in places. Non-blocking.
- No motion tile (`loop.mp4`/`loop.webm`) on the portfolio card, `ffmpeg` and a global headless
  `playwright` render pipeline are unavailable in this environment, the same disclosed gap as
  3 other current portfolio projects (cascadia, predictive-ml-lab, querymind-text-to-sql). The
  card shows its static `cover.jpg` instead.
- Everything already on record in `LIMITATIONS.md` stands unchanged: the rest of the
  chapter-level visual-design pass beyond chapters 3/5's rebuild, mobile/tablet scroll
  frame-pacing (desktop is measured per-chapter; mobile Lighthouse covers load performance but
  not scroll frame-pacing specifically), and the deferred real NYC TLC external-control series.

## Conclusion

THE COUNTERFACTUAL CITY is published and independently verified end to end: live application,
GitHub repository, and portfolio integration all resolve, function correctly, and were checked by
a reviewer with no access to this session's own work, on top of this session's own first-party
live-URL Playwright and Lighthouse passes. `CTY-RELEASE-001` is updated to `independently
verified` in `specifications/REQUIREMENTS.yaml`. No further action is required to consider this
project shipped.

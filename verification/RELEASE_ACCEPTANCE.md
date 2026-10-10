# Release Acceptance Report

**Status: NOT released.** This project has not been deployed or published externally, per the
build's own standing authorization constraint. This report assesses readiness against the
project's own release gate (`CLAUDE.md`) honestly, at the current commit, pending authorization to
publish and a final independent review of the fixes described below.

## Release gate, row by row

| Category | Verdict | Evidence |
|---|---|---|
| Visual design | **Partial.** Intro, chapter 4, and chapter 6 are distinctive and art-directed. Chapters 2, 3, and 5 were rebuilt after review found them sharing one skeleton; chapter 3 now has a real comparative-trajectories chart, chapter 5 a real inverted "diagnostic console," both genuinely distinct in content type, not just color. A full varied-block-treatment/texture pass beyond this is still owed. | `VISUAL_DESIGN.md`, `LIMITATIONS.md` |
| Motion UI | **Done, not yet independently reviewed.** All 6 motion layers present (intro, nav transitions, scroll storytelling, component interaction, data transitions on control change, microinteractions). `CTY-MOTION-001`'s full requirement (reverse-scroll, reduced-motion at every breakpoint for every chapter, scroll recordings + contact sheets, real frame-pacing measurement) is complete. | `MOTION_SYSTEM.md`, `verification/FRAME_PACING.json`, `verification/SCREENSHOTS/*-contact-sheet.png` |
| UX | **Done.** A persistent chapter nav reaches any section; Reset Scenario is reachable from anywhere; every control's own change is visible adjacent to that control (the DiD result lives in chapter 2 next to CTY-INT-001/002, not in a disconnected panel). | `ARCHITECTURE.md`, `e2e/chapterNav.spec.ts` |
| Functionality | **Done.** All 6 controls trigger real recomputation; loading/ready/error states implemented; Reset Scenario restores every control, not just one; an infeasible input (narrowed control pool, placebo below its 2-unit minimum) shows a visible error rather than crashing. | `e2e/controls.spec.ts`, `e2e/smoke.spec.ts` |
| AI / analytical | **Done.** Every number is labeled by claim kind (fitted estimate / counterfactual inference / permutation diagnostic) with an adjacent identification-assumptions caveat. No simulated inference is presented as live; the synthetic-data strategy and its reasoning are disclosed in `DATA_SOURCES.md` and `specifications/DATA_CONTRACT.yaml`, not buried. | `VISUAL_DESIGN.md`'s "result labeling" section, `src/scenes/ResultCaveat.tsx` |
| Performance | **Partial.** One real measurement exists (chapter 4, desktop, production build: ~60.1fps mean, 0 dropped frames against a 30fps threshold). Not yet measured for every chapter/breakpoint, and no Lighthouse perf/a11y score has been taken. | `verification/FRAME_PACING.json` |
| Responsiveness | **Done.** All 6 chapters plus the intro captured at all 3 required breakpoints with deliberate, reviewed compositions (not just reflow), confirmed by real screenshots opened and inspected, not merely generated. | `verification/SCREENSHOTS/` |
| Professional quality | **Done.** `npx tsc -b`, `npx oxlint`, `npx vitest run` (35/35), `npx playwright test` (126/126 across repeated runs), `.venv/bin/python -m pytest analysis/validation/` (25/25) all clean. README/ARCHITECTURE/VISUAL_DESIGN/MOTION_SYSTEM/DATA_SOURCES/TESTING/LIMITATIONS/DEPLOYMENT.md all present. | This repo's own root, `TESTING.md` |
| GitHub | **Partial.** Real, individual commit history (23 commits) with substantive messages tracking every real bug found and fixed. Not yet pushed to a remote. | `git log` |
| Deployment | **Not done**, by design (no authorization yet). | `DEPLOYMENT.md` |
| Portfolio | **Not done**, depends on deployment. |, |

## What independently verified this build, and what has not yet

- **Two self-review rounds** (this session), each catching real issues: layout skeleton repetition
  across chapters, a missing flagship feature, inaccurate result labels, missing units, dead pinned
  scroll ranges, mobile nav occlusion.
- **One genuinely independent review** (a fresh subagent, no access to this session's own notes),
  confirming most self-review findings and correctly catching more: chapter 3's first distinctiveness
  fix was insufficient, chapter 4's divergence motion was imperceptible, a real evidence gap in
  chapter 5's own screenshots.
- **A second independent, worktree-isolated adversarial review** was commissioned after the fixes
  above, specifically to check this round's own remediation with fresh eyes and no access to any of
  this session's notes. See its own report at
  `verification/INDEPENDENT_ADVERSARIAL_REVIEW.md` once complete, and this file's own revision
  history for how its findings were resolved.

## Honest summary

This is a functionally complete, analytically real (no simulated inference, no placeholder numbers),
accessible (zero axe-core violations across repeated checks), and motion-complete build of all 6
dossier chapters plus the intro. The chapter-level visual distinctiveness work and a full
per-chapter performance budget are the two largest remaining gaps against the release gate's own
"Visual design" and "Performance" rows. Deployment is withheld pending explicit authorization, not
because of any known blocking defect.

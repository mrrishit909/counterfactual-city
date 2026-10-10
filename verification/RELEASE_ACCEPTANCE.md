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
| UX | **Done, 1 P0 found and fixed by independent review.** A persistent chapter nav reaches any section; Reset Scenario is reachable from anywhere; every control's own change is visible adjacent to that control. The nav's own active-chapter highlighting never showed the intro as active (a real bug, found adversarially, root-caused and fixed, see `execution/PROGRESS.md`). | `ARCHITECTURE.md`, `e2e/chapterNav.spec.ts` |
| Functionality | **Done, 1 P1 found and fixed by independent review.** All 6 controls trigger real recomputation; loading/ready/error states implemented; Reset Scenario restores every control, not just one. The donor-weights control's own error state used to be a dead end (the whole control disappeared); fixed to stay usable with the error shown alongside it. | `e2e/controls.spec.ts`, `e2e/smoke.spec.ts` |
| AI / analytical | **Done.** Every number is labeled by claim kind (fitted estimate / counterfactual inference / permutation diagnostic) with an adjacent identification-assumptions caveat. No simulated inference is presented as live; the synthetic-data strategy and its reasoning are disclosed in `DATA_SOURCES.md` and `specifications/DATA_CONTRACT.yaml`, not buried. | `VISUAL_DESIGN.md`'s "result labeling" section, `src/scenes/ResultCaveat.tsx` |
| Performance | **Done for desktop frame pacing; Lighthouse pending deployment.** Every chapter measured, forward and reverse, against an idle baseline, desktop, production build: ~60fps mean across the board, 0 dropped frames against a 30fps threshold. Mobile/tablet frame-pacing and a Lighthouse score are taken against the deployed build (see the publication report once published). | `verification/FRAME_PACING.json` |
| Responsiveness | **Done.** All 6 chapters plus the intro captured at all 3 required breakpoints with deliberate, reviewed compositions (not just reflow), confirmed by real screenshots opened and inspected, not merely generated. | `verification/SCREENSHOTS/` |
| Professional quality | **Done, 1 P1 found and fixed by independent review.** `npx tsc -b`, `npx oxlint`, `npx vitest run` (35/35), `npx playwright test` (128/128 across repeated runs), `.venv/bin/python -m pytest analysis/validation/` (25/25) all clean. README/ARCHITECTURE/VISUAL_DESIGN/MOTION_SYSTEM/DATA_SOURCES/TESTING/LIMITATIONS/DEPLOYMENT.md all present. The Python suite had no `requirements.txt`, so it wasn't reproducible from a clean checkout; fixed and re-verified against a genuinely fresh venv. | This repo's own root, `TESTING.md` |
| GitHub | **Partial.** Real, individual commit history with substantive messages tracking every real bug found and fixed. Not yet pushed to a remote. | `git log` |
| Deployment | **Not done**, by design (no authorization yet). | `DEPLOYMENT.md` |
| Portfolio | **Not done**, depends on deployment. | n/a |

## What independently verified this build, and what has not yet

- **Two self-review rounds** (this session), each catching real issues: layout skeleton repetition
  across chapters, a missing flagship feature, inaccurate result labels, missing units, dead pinned
  scroll ranges, mobile nav occlusion.
- **One genuinely independent review** (a fresh subagent, no access to this session's own notes),
  confirming most self-review findings and correctly catching more: chapter 3's first distinctiveness
  fix was insufficient, chapter 4's divergence motion was imperceptible, a real evidence gap in
  chapter 5's own screenshots.
- **A worktree-isolated independent adversarial review** (a fresh subagent, isolated in its own git
  worktree, no access to this session's own notes, `git log`, or any `note:` field in
  `REQUIREMENTS.yaml`), commissioned after the fixes above. It independently re-ran the entire
  verification suite from a clean install and found 1 P0, 2 P1s, and 2 P2s, all fixed this session
  with reproduce-before-fix discipline (see `execution/PROGRESS.md`'s own entry). Full report:
  `verification/INDEPENDENT_ADVERSARIAL_REVIEW.md`.
- **A second, focused, worktree-isolated verification pass** independently re-confirmed all 5 fixes
  above, with its own ad-hoc scripts reproducing each ORIGINAL finding's exact repro steps against a
  real production build (not reading this session's own account of how each was fixed). Result: all
  5 PASS, no partial fixes, no regressions. Full report:
  `verification/REMEDIATION_VERIFICATION.md`.

## Honest summary

This is a functionally complete, analytically real (no simulated inference, no placeholder numbers),
accessible (zero axe-core violations across repeated checks), and motion-complete build of all 6
dossier chapters plus the intro, that has now survived one full worktree-isolated adversarial review
AND a second, independent, worktree-isolated verification pass confirming every one of that review's
findings is genuinely fixed, not self-reported. The chapter-level visual distinctiveness work and a
full per-chapter performance budget are the two largest remaining gaps against the release gate's
own "Visual design" and "Performance" rows, both honestly disclosed, neither a defect a reviewer
found and the team failed to fix. Deployment is withheld pending explicit authorization, not because
of any known blocking defect.

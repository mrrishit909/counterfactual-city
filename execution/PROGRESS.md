# THE COUNTERFACTUAL CITY, Progress

## Current milestone

M0-M4 and Stage 1 (architecture acceptance) DONE. Stage 2 (cinematic vertical slice: intro only,
beats A-C) built, independently reviewed, and remediated. The review's verdict was SLICE NOT SOUND
with 3 blocking defects; all 3 (plus 3 non-blocking findings) are fixed and self-verified with
reproduce-before-fix evidence (see `verification/STAGE2_INDEPENDENT_REVIEW.md`), but this fix pass
has not itself gone through a fresh re-review, so `CTY-MOTION-001` stays `implemented`, not
`independently verified`. The review's own honest visual-quality assessment (current intro reads as
a generic wireframe grid, not yet "distinctive, polished, art-directed") is carried forward as
explicit Stage 3 work, not fixed in this pass.

Full 6-chapter build, laboratory integration inside the cinematic experience, performance engineering,
and final adversarial review are explicitly NOT started yet, by design, not oversight. See "Next
critical-path task" below.

This is an honest in-progress state, not a completion claim. The Atlas's own complexity estimate for
this project is 9/10 overall with a rough effort of 106-232 focused person-hours (docs/PROJECT_SPEC.md).

## Latest verified commit

Run `git log --oneline -5` in `~/counterfactual-city` for the exact hash; this file is updated in the
same commit as the work it describes, so the latest commit IS the latest verified state.

## Completed requirements (specifications/REQUIREMENTS.yaml)

- `CTY-DATA-001`: **implemented**. Fully synthetic panel, declared treatment (a real NYC TLC +
  external-control series was evaluated and explicitly deferred, not silently swapped in).
- `CTY-MATH-001`: **implemented**. 25/25 pytest: ground-truth ATT recovery (DiD + synthetic control),
  an independent two-method cross-check, placebo/pretrend diagnostics, 11 boundary/infeasible cases.
- `CTY-INT-001` (change intervention date): **implemented**.
- `CTY-INT-002` (select treated zone): **implemented**.
- `CTY-INT-003` (pick control pool): **implemented** as an explicit allow-list (not an exclude-list,
  see LIMITATIONS.md).
- `CTY-INT-004` (adjust synthetic-control weights): **implemented**. A real bug was found and fixed
  during this build: applying custom weights silently no-opped whenever the control pool was at its
  default "use all zones" value, because the weights-array construction guard required a defined
  explicit pool. Fixed by resolving the same effective pool the estimator defaults to internally.
- `CTY-INT-005` (run placebo test): **implemented**, an explicit user-triggered action per the
  dossier's own framing ("launch placebo"), not continuously auto-recomputed.
- `CTY-INT-006` (change outcome variable): **implemented**.
- `CTY-UX-001` (6 controls + keyboard/touch/reset, e2e-recorded): **implemented**. 17/17 Playwright,
  3/3 axe-core (zero violations). Two real a11y findings fixed: no landmark region wrapping the page
  (added `<main>`), and the dossier's own accent red failing WCAG AA text contrast (3.56:1), fixed
  with a darkened text-only variant (6.49:1).

`CTY-INT-001` through `006`, `CTY-MATH-001`, and `CTY-UX-001` are now **independently verified**
(Stage 1 review, see `verification/STAGE1_ARCHITECTURE_REVIEW.md`). `CTY-DATA-001` remains
`implemented` only, the review's scope didn't specifically re-check the data-licensing reasoning.

## Unfinished requirements

- `CTY-MOTION-001`: **implemented** (intro only, beats A-C). See `verification/
  STAGE2_INDEPENDENT_REVIEW.md` for the full review/fix record. Not yet `independently verified`
  (the fix pass itself hasn't had a fresh review) and not yet covering chapters 2-6.
- `CTY-RELEASE-001`: `unstarted`, depends on the full chapter build (Stage 3-5) and deployment
  readiness (Stage 9).

## Passing tests

- `analysis/validation/test_estimators.py`: 25/25 (`source .venv/bin/activate && python3 -m pytest
  analysis/validation/ -v`).
- `src/**/*.test.{ts,tsx}` (Vitest): 35/35 (`npx vitest run`), including DiD parity (9 cases, 1e-6),
  synthetic-control/placebo/pretrend parity (looser tolerance, different NNLS algorithm, documented
  in the test file and LIMITATIONS.md), boundary/infeasible cases for all 4 estimator functions, and
  the city-layout/result-encoding pure-function tests added in Stage 2.
- `e2e/*.spec.ts` (Playwright, production build): 35/35 (`npx vite build && npx playwright test`).
  Covers all 6 controls' real recomputation, Reset Scenario restoring every control, sequential
  multi-control composition, keyboard operability, a touch-emulated-context test, zero console
  errors/failed requests, zero axe-core violations, a regression test for the Stage 1 review's
  slider-desync finding, and (Stage 2) the intro's forward/reverse/fast-jump scroll, Skip Intro
  (normal and reduced motion), 3 responsive breakpoints, and 3 regression tests for the Stage 2
  review's 3 blocking defects, all confirmed to fail against the pre-fix code before confirming
  they pass against the fix.
- `npx tsc -b`: clean. `npx oxlint`: clean (one non-blocking fast-refresh-only warning in
  `ScenarioContext.tsx` from combining a Provider and a hook in one file, a deliberate pattern).

## Failing tests

None.

## Open P0/P1 issues

None open. See `LIMITATIONS.md` for disclosed, non-blocking findings (a rapid-synchronous-slider-
burst edge case found only via an unrealistic test harness pattern, the control-pool's allow-list-
not-exclude-list semantics).

## Performance status

Not yet measured; no motion/3D work exists yet to budget against. Will be measured starting Stage 4.

## Active workstreams

None currently running; this session's work ended at a clean, fully green commit boundary.

## Next critical-path task

**Stage 1 done** (verdict ARCHITECTURE SOUND, see `verification/STAGE1_ARCHITECTURE_REVIEW.md`).
**Stage 2 done and remediated**: an independent review returned SLICE NOT SOUND with 3 blocking
defects (error-state dead end, Skip Intro no-op under reduced motion, camera pushing the treated
zone off-screen); all 3 fixed and re-verified with reproduce-before-fix evidence, plus 3
non-blocking findings fixed in the same pass (see `verification/STAGE2_INDEPENDENT_REVIEW.md`). The
review's own visual-quality verdict (reads as a generic wireframe, not yet "distinctive, polished,
art-directed") was NOT addressed in the fix pass and is carried into Stage 3 below as explicit,
tracked work, not silently dropped. Design-system docs written ahead of Stage 3
(`docs/ART_DIRECTION.md`, `DESIGN_SYSTEM.json`, `MOTION_SPECIFICATION.md`,
`RESPONSIVE_COMPOSITIONS.md`), including the 6-chapter-to-control mapping and the flagged palette
re-skin.

**Stage 3-5: full 6-chapter build.**
1. **DONE**: re-skinned the persistent city stage from Stage 2's dark placeholder palette to the
   dossier's real light palette (`src/scenes/scenes.css`: `--paper` background, white zone blocks,
   `--hairline` roads, `--ink` labels), per `docs/ART_DIRECTION.md` section 1. Confirmed live and
   in `verification/SCREENSHOTS/intro-*.png`; 35/35 tests still green after the change.
2. Still owed: a real visual-design pass on the city grid itself (varied block treatment,
   asymmetric composition, texture/depth cues), not just the color swap in step 1, per the Stage 2
   review's own honest assessment that the current grid is too uniform/generic to clear the
   portfolio-wide release gate.
3. **DONE (chapter 2 of 5)**: built chapter 2 ("treatment", `src/scenes/Chapter2Treatment.tsx`),
   hosting CTY-INT-001 and CTY-INT-002, migrated OUT of the flat Lab panel (no longer duplicated:
   `InterventionDateControl`/`TreatedZoneControl` moved to `src/controls/TreatmentControls.tsx` to
   avoid a circular import between `App.tsx` and the new chapter). Its own `CityStage` instance
   (per `docs/ART_DIRECTION.md` section 7 item 1's revised rule: one visual language, not one DOM
   node) reframes on scroll to the chosen treated zone, with its own reduced-motion and responsive
   handling. A real bug was found and fixed while wiring this up: `CityStage` needs a per-instance
   `instanceId` prop once a second chapter exists, otherwise two mounted stages collide on
   `data-testid`/`id`, breaking Playwright's strict-mode locators and failing an axe-core "region"
   check (the plain `<section id="ch2">` also needed `aria-labelledby`, a real landmark-naming
   finding, not previously an issue with only one top-level section). 8/8 new Playwright
   (`e2e/chapter2.spec.ts`); full suite after this change: 43/43 Playwright, 35/35 Vitest, tsc
   clean, oxlint clean.
4. Still owed: chapters 3-6 (matched controls, counterfactual [flagship], diagnostics, limitations),
   each wiring in its own 1-2 of the remaining 4 controls (CTY-INT-003 through 006, currently still
   in the plain Lab panel), each with its own e2e coverage matching chapter 2's own pattern
   (forward/reverse/fast-jump/reduced-motion/responsive), and the real visual-design pass from step
   2 above (not yet done).

**Stage 6-9**: laboratory integration inside the full cinematic experience (once all 6 chapters
exist, decide what if anything remains in a standalone "lab" section), performance engineering
(measured, not invented), independent adversarial review of the complete build (including a fresh
look at Stage 2's remediated intro and chapter 2, not just the newest chapters), final release
acceptance. Not started.

## Decision log (append here, do not re-litigate once recorded)

- **Data source: fully synthetic, not NYC TLC.** See `specifications/DATA_CONTRACT.yaml`.
- **Donor-weight solver, Python side: NNLS relaxation, not SLSQP.** SLSQP reproducibly failed to
  converge on this panel's near-collinear donor matrix. NNLS with an augmented sum-to-one row is used
  instead.
- **Donor-weight solver, TypeScript side: projected gradient descent, not a port of scipy's NNLS.**
  Both solve the same convex NNLS problem via different, independently-convergent algorithms; parity
  is checked at the level of the recovered estimate, not bit-identical weights. See the comment on
  `nnlsProjectedGradient` in `src/engine/estimators.ts` and LIMITATIONS.md.
- **CTY-INT-003's control pool is an explicit allow-list, not an exclude-list.** Checking one zone
  with none previously checked means "use only this zone." Disclosed in the control's own hint text
  and in LIMITATIONS.md; worth reconsidering during the design-system pass if real UX testing wants
  exclude-list semantics instead, not revisited without that evidence.
- **CTY-INT-005 (placebo) is an explicit user-triggered action, not auto-recomputed on every scenario
  change,** both because the dossier frames it that way ("launch placebo") and because a full placebo
  sweep is materially more expensive than the other 5 controls' single-fit cost.
- **Donor-weight slider rows are keyed on a `weightsRevision` counter, not just the zone id.** Found
  by the Stage 1 independent review: an uncontrolled `defaultValue` input does not get its rendered
  value updated by React on a re-render, so the slider thumbs could visibly desync from the actual
  applied weights after clearing custom weights. Bumping a revision counter on apply/clear/reset and
  including it in the row's key forces a real remount instead. See LIMITATIONS.md.
- **Synthetic-control TS/Python parity tolerance is 3 units, not 40.** The looser bound (reasoned as
  "two different NNLS algorithms can land on different vertices") was real but far wider than the
  actual achieved agreement (sub-1-unit on all 3 outcomes); the Stage 1 review correctly flagged it
  as a regression-safety gap, not a currently-wrong result. Tightened with headroom above observed
  drift.
- **The persistent cinematic stage uses plain CSS `position: sticky`, not GSAP's `pin: true`.**
  `pin: true` + a relative percentage `end` value was tried first for the intro and found, by direct
  browser inspection (not assumed), to produce a pin-spacer with ZERO added height for the pin
  duration, trapping scroll inside the section with literally no way to reach the lab below,
  confirmed live with 100 real wheel-scroll ticks. CASCADIA's own persistent-stage chapters
  (`~/cascadia/src/scenes/experience.css`'s `.stage-sticky`) already use plain CSS sticky instead of
  GSAP pinning, a proven pattern reused here per the build directive's own instruction to reuse
  verified infrastructure rather than re-fight the same bug from scratch. `src/scenes/useScene.ts`
  (the shared GSAP lifecycle wrapper) is ported directly from CASCADIA's own implementation.

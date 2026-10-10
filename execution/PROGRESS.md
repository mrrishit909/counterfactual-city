# THE COUNTERFACTUAL CITY, Progress

## Current milestone

M0-M4 and Stage 1 (architecture acceptance) DONE. All 6 required interactions (CTY-INT-001 through
006), CTY-DATA-001, CTY-MATH-001, and CTY-UX-001 are implemented; all but CTY-DATA-001 are now
**independently verified** (see `verification/STAGE1_ARCHITECTURE_REVIEW.md`). A fresh reviewer with
no access to this session's own notes found and this session fixed one real defect (slider thumb
desync after clearing custom weights) and one test-quality gap (a parity tolerance 40x looser than
actually needed); verdict was ARCHITECTURE SOUND to proceed.

Chapters, intro, art direction, 3D, and motion are explicitly NOT started, by design (Stage 2 next),
not oversight.

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

- `CTY-MOTION-001`, `CTY-RELEASE-001`: `unstarted`, depend on the chapters/intro/motion work (Stage
  2-3) and deployment (Stage 6).

## Passing tests

- `analysis/validation/test_estimators.py`: 25/25 (`source .venv/bin/activate && python3 -m pytest
  analysis/validation/ -v`).
- `src/**/*.test.{ts,tsx}` (Vitest): 27/27 (`npx vitest run`), including DiD parity (9 cases, 1e-6),
  synthetic-control/placebo/pretrend parity (looser tolerance, different NNLS algorithm, documented
  in the test file and LIMITATIONS.md), and boundary/infeasible cases for all 4 estimator functions.
- `e2e/smoke.spec.ts` + `e2e/controls.spec.ts` + `e2e/a11y.spec.ts` (Playwright, production build):
  18/18 (`npx vite build && npx playwright test`). Covers all 6 controls' real recomputation, Reset
  Scenario restoring every control (not just one), sequential multi-control composition, keyboard
  operability (range/select), a dedicated touch-emulated-context test, zero console errors/failed
  requests across a full interaction pass, zero axe-core violations before and after interacting
  with every control, and a regression test for the Stage 1 review's slider-desync finding (confirmed
  to fail against the pre-fix code before confirming it passes against the fix).
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

**Stage 1 is done** (verdict ARCHITECTURE SOUND, 2 findings fixed, see
`verification/STAGE1_ARCHITECTURE_REVIEW.md`). Next:

**Stage 2: cinematic vertical slice.** One integrated sequence with a real
3D/spatial city environment, continuous camera movement, GSAP scroll choreography, a functional
intervention control, real counterfactual computation, a data-driven visual change, reverse-scroll
restoration, and responsive/reduced-motion alternatives, art-directed per
`docs/VISUAL_REFERENCE_RESEARCH.md` and the dossier's palette (`#F3F0E8`/`#D65343`/`#4B84C5`). Do NOT
build all 6 chapters until this slice is independently verified (directive's own explicit instruction).

**Stages 3-6** (full chapters, production optimization, independent adversarial review, final release
acceptance) follow in that order, per the directive.

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

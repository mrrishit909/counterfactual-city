# Known Limitations

Honest, current record of deliberate scope decisions and known gaps. Updated as the build
progresses; see `execution/PROGRESS.md` for the fuller narrative and `specifications/
REQUIREMENTS.yaml` for per-requirement status.

## Data

- **Fully synthetic panel, not NYC TLC.** A real, verified compatible external-control series was
  not completed; the dossier's own explicit fallback (a synthetic panel with a declared treatment)
  is used instead and labeled as such everywhere a number is shown. See
  `specifications/DATA_CONTRACT.yaml`.

## Analytical engine

- **Two independent NNLS implementations, not one.** The Python oracle uses `scipy.optimize.nnls`
  (Lawson-Hanson active-set); the TypeScript port uses projected gradient descent. Both solve the
  same convex problem and are checked for parity at the level of the recovered estimate (ground-
  truth ATT, weight feasibility), not bit-identical weights, since two different algorithms can
  land on different vertices of a near-degenerate feasible region (this panel's pre-trends are
  parallel by construction, so many donor-weight combinations fit almost equally well). See the
  comment on `nnlsProjectedGradient` in `src/engine/estimators.ts`.

## Frontend UI (CTY-INT-004, synthetic control weights)

- **FIXED: slider thumb position could visually desync from the applied weights.** An independent
  architecture review (Stage 1 of the build) caught this live: after dragging weights and clicking
  "Use auto-fit weights," the displayed percentage labels correctly updated but the slider THUMBS
  (uncontrolled `defaultValue` inputs) stayed at their last-dragged position, visibly contradicting
  the number next to them. Fixed by keying each slider row on a `weightsRevision` counter
  (`src/engine/ScenarioContext.tsx`) that bumps on apply/clear/reset, forcing a real remount instead
  of relying on `defaultValue` (which React does not re-apply to an existing DOM node). Regression
  test: `e2e/controls.spec.ts`, "slider thumb positions stay in sync..."; confirmed to fail against
  the pre-fix code (thumb/label mismatch of 0.95) before confirming it passes against the fix.
- **Rapid, fully-synchronous programmatic slider edits can drop an update for 1-2 of ~20+ sliders.**
  Found while writing `e2e/controls.spec.ts`: dispatching `input`/`change` events on all ~23 donor-
  weight sliders back to back in a single synchronous script (no yield between them) occasionally
  left 1-2 sliders holding their pre-edit value instead of the newly dispatched one, consistent
  with a React state-batching edge case under an unrealistic event burst. A real user dragging
  sliders one at a time, or Playwright's own per-action round trips (which do yield between calls),
  never reproduced it. Worked around in the test by narrowing the control pool to 2 donors first
  (CTY-INT-003) before testing CTY-INT-004's weight application, which also happens to be a more
  realistic user flow than rebalancing 20+ sliders at once. Not yet root-caused or fixed in the
  component itself; flagged here rather than silently worked around only in the test.
- **The control pool (CTY-INT-003) is an explicit allow-list, not an exclude-list.** Checking one
  zone with no others checked means "use only this zone," not "use every zone except this one." A
  user who wants to drop a single outlier from a large default pool must check every other zone
  individually. This is disclosed in the control's own hint text, not silently ambiguous, but is
  worth reconsidering during the design-system pass (M3.4) if the real UX turns out to want
  exclude-list semantics instead.
- **Not yet styled or art-directed.** The current UI is a correct, accessible, functional
  architecture slice (M3), not the cinematic/editorial treatment `docs/VISUAL_REFERENCE_RESEARCH.md`
  and the dossier's palette describe. Intentional sequencing (verify the architecture before
  investing in visuals), not an oversight.

## Not yet built

All 6 chapters, the cinematic intro, the flagship "two urban timelines diverge" interaction, 3D/
spatial rendering (if justified by measurement), responsive compositions beyond the 3 smoke-test
viewports, reduced-motion handling (there is no motion yet to reduce), and performance budgets.

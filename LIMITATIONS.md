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

## Cinematic intro (Stage 2)

- **Visual quality does not yet fully meet the "distinctive, polished, art-directed" bar.** An
  independent review's own words: the (then dark-palette) intro "reads as a wireframe, not a
  finished cinematic city... a uniform grid of identical flat gray rounded rectangles... no
  skyline, no depth, no texture." Three real functional defects found by the same review (an
  error-state dead end, a reduced-motion Skip Intro no-op, and a camera-targeting bug) were fixed
  and verified (`verification/STAGE2_INDEPENDENT_REVIEW.md`). The palette half of the visual
  finding is now fixed (re-skinned to the dossier's real `#F3F0E8`/`#D65343`/`#4B84C5` palette,
  `src/scenes/scenes.css`, confirmed live and in screenshots). The other half, varied block
  treatment, asymmetric composition, texture/depth beyond a uniform grid, is still owed and
  remains explicit Stage 3 work, not silently dropped.
- **This fix pass has not itself been re-reviewed by a fresh, separate reviewer.** Self-verified
  thoroughly (reproduce-before-fix evidence for all 3 blocking defects, full suite green,
  live-screenshot confirmation), but `CTY-MOTION-001` stays at `implemented`, not
  `independently verified`, until a fresh pass confirms the fixes.

## Chapter 3 (matched controls)

- **Ships the real control with a real comparative tie-in (control-pool zones highlighted blue on
  the shared stage), not yet the fuller 3-column small-multiples trajectory comparison
  `docs/ART_DIRECTION.md` section 3 describes.** That fuller view would show each candidate
  control zone's own trajectory alongside the treated zone's on a shared axis; the current chapter
  shows WHICH zones are selected spatially, which is real and functional, but not the full
  envisioned comparative chart. A further visual enhancement, not a defect in what's shipped.

## Chapter 4 (counterfactual, the flagship interaction)

- **Two independent `CityStage` mounts, not a single shared camera cross-fading between an
  "observed" and "synthetic" state.** This matches the project's own resolved "one persistent
  visual language, not one DOM node" architecture decision (`docs/ART_DIRECTION.md` section 7 item
  1): each chapter gets its own stage mount rather than forcing a shared-node redesign onto chapters
  2-3's already-verified sticky-section pattern. The visual effect (two timelines, same city,
  drawing apart) is real; the two stages are two separately-rendered SVGs, not one SVG split in two.
- **The synthetic-counterfactual stage's color/pulse encoding (`resultVisualEncoding.ts`) uses a
  fixed per-outcome scale constant, not a scale fit to the live data's own observed effect-size
  distribution.** A gap near the scale's own calibration point reads as fully saturated red/blue;
  very large or very small real gaps will clip or barely register visually even though the numeric
  "Gap:" readout next to it is always the exact, uncapped `sc.attPostMean`.

## Not yet built

Chapters 5-6 (diagnostics, limitations, per `docs/ART_DIRECTION.md`'s chapter plan), 3D/spatial
rendering (if justified by measurement), responsive compositions per-chapter beyond chapters 1-4's
own 3 breakpoints, and performance budgets.

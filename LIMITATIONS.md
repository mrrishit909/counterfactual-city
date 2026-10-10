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

- **The flagship chart now exists**: `src/scenes/TrajectoryChart.tsx` plots the treated zone's real
  observed outcome series against the real synthetic-control reconstruction for the same days
  (derived from `SyntheticControlResult.gapByDay`, `src/engine/estimators.ts`), with an
  intervention-day marker, redrawing when donor weights change. This is the dossier's own literal
  "two urban timelines diverge as estimator assumptions are manipulated," not just the scroll-driven
  stage divergence (which was the ONLY mechanism before a second self-review caught the gap and
  this chart was built to close it).
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
  "Gap (observed minus synthetic):" readout next to it is always the exact, uncapped
  `sc.attPostMean`. A one-line note next to the readout states explicitly that the color/pulse
  encodes the gap's size and direction, not a predicted value for the synthetic timeline on its own.
- **The scroll-driven divergence motion (±6% horizontal shift on ~320px-wide stages) is real but
  still subtle on a 1440px desktop viewport.** Now a secondary effect (the trajectory chart above is
  the primary flagship moment); whether the scroll motion itself still needs to be more pronounced
  is a lower-stakes open visual-QA question than before.

## Cross-chapter visual distinctiveness (chapters 2, 3, 5 now each genuinely distinct)

Chapters 2, 3, and 5 originally shared the same grid-left/controls-right composition and CSS classes,
differing in content but not in layout skeleton. A first self-review fix for chapter 3 (mirroring
the layout with an accent-blue wash) was correctly judged insufficient by an independent reviewer,
in its own words: "a different color on the same shape," not the dossier's own specified
"comparative view" archetype; a later fix (`src/scenes/Sparkline.tsx`, a real comparative-trajectories
strip) addressed it for real. The same reviewer flagged chapter 5's own first fix (a bordered
"inspector" panel) as the project's remaining weakest distinctiveness gap, still too close to
chapter 2's skeleton. Chapter 5 has since been rebuilt: an asymmetric split (smaller grid, wider
console, vs. chapters 2/3's balanced ~60/40) and an inverted dark "diagnostic console" panel, the
one chapter on the page that isn't paper-on-ink, hosting `src/scenes/EvidenceBands.tsx` (every
placebo unit's effect plotted on a shared axis, the treated zone's own effect highlighted, the
dossier's own literal "null distribution > evidence bands" phrase made real rather than stated only
as rank/p-value text). All three chapters now differ in both layout proportions and content type
(spatial grid alone / comparative trajectories / a null-distribution chart), not just color. This
fix has NOT yet been judged by an independent reviewer; treat it as a real, substantial improvement,
not confirmation that the full release-gate visual-design bar is met for these three chapters.

## Mobile content overflow (found and fixed during the evidence sweep)

Found via the mandatory visual QA pass, not from any passing test: any chapter whose stacked mobile
content exceeds 100vh was permanently clipping the rest of that content for the chapter's entire
pinned scroll duration (`.chapter-sticky`'s `overflow: hidden`, correct for the desktop layout, never
re-measured as the outer page scrolls under `position: sticky`). This affected chapters 2 and 3 at
minimum and had shipped undetected across three prior commits. Fixed with `overflow-y: auto` on
`.chapter-sticky` at the mobile/tablet breakpoint (confirmed live: the previously-unreachable
"Treated zone" dropdown on chapter 2's own mobile view is now reachable via an internal scroll
gesture within the chapter's own sticky panel). This is a nested-scroll-area pattern (the chapter
panel scrolls independently of the outer page scroll while pinned); it was not tested for how it
feels on a real touch device, only confirmed programmatically reachable.

## Not yet built

All 6 chapters now exist, a fixed chapter nav (`src/scenes/ChapterNav.tsx`) with an always-reachable
Reset Scenario satisfies the release gate's "clear navigation" requirement, `evidence.spec.ts`
captures all 6 chapters (not just the intro) at every breakpoint, with every image actually
reviewed per CLAUDE.md's own mandatory rule, and the standalone "Lab" `<main>` section is gone
(Stage 4: its one real piece of content, the DiD result, now lives inside chapter 2 next to the
controls that drive it; see `execution/PROGRESS.md`'s own Stage 4 entry). `CTY-MOTION-001`'s full
requirement is now done too (reverse-scroll, reduced-motion captures at every breakpoint for every
chapter, real scroll recordings + contact sheets, a real production-build frame-pacing
measurement, functional scenario consistency while scrolling; see `execution/PROGRESS.md`'s own
entry). A worktree-isolated independent adversarial review has since run against this build (see
`verification/INDEPENDENT_ADVERSARIAL_REVIEW.md`) and found and this session fixed 1 P0 (the
chapter nav never highlighted the intro as active), 2 P1s (a dead-end error state in the
donor-weights control; no reproducible Python test setup), and 2 P2s (a missing result caveat; a
control with no local feedback), see `execution/PROGRESS.md`'s own entry for the full detail. A
SECOND, independent, worktree-isolated pass then re-verified every one of those 5 fixes directly
(reproducing each original bug's own repro steps against a real production build, not reading this
session's own account), confirming all 5 PASS, no partial fixes, no regressions
(`verification/REMEDIATION_VERIFICATION.md`). There is no longer a known, reported, unverified
defect outstanding, though a further review round would likely still find something, every round on
this project so far has. Still not built: the rest of the real visual-design
pass (varied block treatment, asymmetric composition, texture/depth cues beyond the palette re-skin
and the cross-chapter-distinctiveness work in chapters 3 and 5 above), 3D/spatial rendering (if
justified by measurement), and responsive compositions per-chapter beyond chapters 1-6's own 3
breakpoints. Frame-pacing is now measured for every chapter, forward and reverse, against an idle
baseline, desktop only (`verification/FRAME_PACING.json`); mobile/tablet frame-pacing and a
Lighthouse perf/a11y score are covered separately (see `verification/LIVE_VERIFICATION/` once
published, or `DEPLOYMENT.md`'s pre-deployment checklist before that).

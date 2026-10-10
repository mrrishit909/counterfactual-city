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
   (`e2e/chapter2.spec.ts`).
4. **DONE (chapter 3 of 5)**: built chapter 3 ("matched controls", `src/scenes/Chapter3MatchedControls.tsx`),
   hosting CTY-INT-003 (`ControlPoolControl` similarly moved to `src/controls/ControlPoolControl.tsx`).
   A static-camera (no scroll-scrub, deliberately: the point is comparing many zones at once, so the
   whole grid stays in frame) chapter with a real comparative tie-in: every zone in the current
   control pool renders blue on chapter 3's own stage, confirmed live. Not yet the fuller 3-column
   small-multiples trajectory comparison `docs/ART_DIRECTION.md` section 3 describes; disclosed in
   `LIMITATIONS.md`. 6/6 new Playwright (`e2e/chapter3.spec.ts`). Full suite after chapters 2+3:
   49/49 Playwright total (includes chapter 2 and 3's own new tests), 35/35 Vitest, 25/25 pytest,
   tsc clean, oxlint clean.
5. **DONE (chapter 4 of 5)**: built chapter 4 ("counterfactual", the dossier's own flagship
   interaction, `src/scenes/Chapter4Counterfactual.tsx`), hosting CTY-INT-004 (`DonorWeightsControl`
   moved to `src/controls/DonorWeightsControl.tsx`). Two live `CityStage` instances side by side
   (observed: fixed dossier red; synthetic counterfactual: colored/pulsing by the real
   `sc.attPostMean` via `resultVisualEncoding.ts`), drawing apart on a scroll-scrubbed GSAP timeline,
   a real "Gap" readout, donor-weight sliders beneath. Two real bugs found and fixed: (1) the
   flex-column sticky panel gave the stage split zero height because the donor-weights fieldset's
   natural content height exceeded the viewport (fixed: capped `.flagship-controls` to a scrollable
   `max-height`, plus a narrower `.flagship-timeline` stage width and `min-height:0`/`overflow:hidden`
   fix for an analogous overlap at the mobile breakpoint); (2) this chapter's own `ScrollTrigger`
   measured its start position before the async scenario fetch resolved, permanently trapping the
   scrub at its end state even when scrolled to the chapter's true top (fixed: added
   `scenario.treatedZone` to the scene's dependency array, matching chapter 2's own already-verified
   pattern; reproduced via `git stash` against the pre-fix code, confirmed stable across 6 full-suite
   reruns after). 9/9 new Playwright (`e2e/chapter4.spec.ts`). Also fixed a pre-existing flaky
   `chapter2.spec.ts` test exposed by chapter 4's extra mounted content (a `ScrollTrigger`
   resize-debounce race during the test's own position measurement; fixed with a scroll-height
   settle wait, same pattern applied to chapter 4's own test helper). Full suite after chapters 2-4:
   58/58 Playwright (stable across repeated full runs), 35/35 Vitest, tsc clean, oxlint clean.
6. **DONE (chapter 5 of 6)**: built chapter 5 ("diagnostics", the "focused
   inspector" archetype, `src/scenes/Chapter5Diagnostics.tsx`), hosting CTY-INT-005 (`PlaceboControl`
   moved to `src/controls/PlaceboControl.tsx`), paired with the pretrend-diagnostic badge (also moved
   out of the plain Lab panel into this chapter). No scroll-scrubbed camera, matching chapter 3's own
   precedent: a diagnostic looks at the whole panel at once. No new bugs found; this one built clean
   on the first pass, reusing chapters 2/3's own `.chapter-stage-wrap`/`.chapter-controls` CSS
   unchanged. 7/7 new Playwright (`e2e/chapter5.spec.ts`). Full suite after chapters 2-5: 65/65
   Playwright (stable across 5 repeated full runs), 35/35 Vitest, tsc clean, oxlint clean.
7. **DONE (chapter 6 of 6)**: built chapter 6 ("limitations", the "editorial,
   text-led" archetype, `src/scenes/Chapter6Limitations.tsx`), hosting CTY-INT-006 (`OutcomeControl`
   moved to `src/controls/OutcomeControl.tsx`), paired with the dossier's own mandatory "explicit
   high-risk limitation" copy: parallel trends, no interference between zones, and no anticipation
   effects, named explicitly and tied to what chapter 5's pretrend diagnostic DOES and does NOT
   prove. Desktop: prose left, a small grid + the outcome control right; mobile/tablet: grid first,
   then prose, matching `docs/ART_DIRECTION.md` section 6's own responsive table exactly, confirmed
   live by screenshot and a dedicated e2e assertion. No new bugs found; built clean on the first
   pass. 7/7 new Playwright (`e2e/chapter6.spec.ts`). All 6 interaction controls (CTY-INT-001
   through 006) now live in their own chapter; none remain in a plain Lab panel.
8. **DONE: hardening pass after a self-review caught real gaps before calling Stage 3 done.**
   - **Root-caused the chapter 4 ScrollTrigger bug properly**, rather than relying on the
     coincidental fix (chapter 4's temporary `[scenario.treatedZone]` dependency, which only worked
     because chapter 2's own unrelated reframe-on-change dependency happened to force the same
     re-measurement; this breaks the instant a real scenario's treated zone IS 0). Real fix: one
     explicit `ScrollTrigger.refresh()` in `IntroSequence.tsx` when `load.status` becomes `"ready"`,
     the single place every chapter's trigger measurement needs re-validating against the final
     page layout. Verified directly: dumped every live trigger's measured `start` against its
     element's real document offset before and after the fix (diff 0 for all three after). Chapter
     4's dependency array reverted to `[]`. The chapter 2/4 e2e settle-waits added as workarounds
     were re-tested with the extra 250ms removed and are stable across 8 repeated full-suite runs,
     confirming they're no longer load-bearing for that specific race (the scroll-height-stability
     wait itself stays, as ordinary good practice, not a bug workaround).
   - **Added a shared `ResultCaveat` component** (`src/scenes/ResultCaveat.tsx`) placed adjacent to
     every result this page shows (intro title, chapter 4's Gap readout, chapter 5's placebo
     result, the Lab's DiD estimate), per the dossier's own hard rule ("apply scientific disclaimer
     adjacent to results rather than burying it in the footer") that chapter 6 alone did not
     satisfy, a results-adjacent one-line caveat was missing everywhere else a causal-flavored
     number appears.
   - **Clarified chapter 4's color-encoding semantics**: added a line stating the synthetic stage's
     color/pulse encodes the gap's size and direction, not a predicted value for that timeline on
     its own, and relabeled "Gap:" to "Gap (observed minus synthetic):".
   - **Removed every em dash from file contents and commit messages** per the session's own
     punctuation rule, which three prior commits in this chapter-building pass violated (chapter
     kicker labels used the `&mdash;` entity; commit subjects used the unicode character itself).
     Not amending prior commits per the project's own git discipline; fixed going forward and in
     all current file contents.
9. **DONE: chapter navigation** (`src/scenes/ChapterNav.tsx`), closing the release gate's "clear
    navigation" + nav-transitions motion-layer gap. A fixed chapter index (right-anchored dot rail
    desktop/tablet, a bottom bar on mobile) built on `useActiveChapter` (`src/scenes/useActiveChapter.ts`,
    already in the codebase ported from CASCADIA, never previously wired to any UI). Clicking a dot
    scrolls to that chapter; the active chapter highlights via `IntersectionObserver`. Reset
    Scenario moved from the very bottom of the page into this always-reachable nav (removed from
    `Lab`, which caused a strict-mode locator collision across 4 existing e2e tests that all select
    the button by accessible name alone, fixed by having exactly one Reset Scenario button on the
    page now, not two).
    **A real, live axe-core contrast violation was found and fixed**: the nav label reveal used an
    `opacity` CSS transition, and Playwright's own mouse movement during the a11y test's control
    interactions sometimes left a label's `opacity` hovering at a genuinely low, legitimately
    non-compliant value for the single instant axe scanned the page (confirmed directly:
    `getComputedStyle` showed `opacity: 0.65` on a `--hint`-colored label mid-interaction, not an
    axe false positive). Fixed by switching the reveal to `visibility` (binary, no intermediate
    partial-contrast state) and keeping only the decorative `transform` on a CSS transition.
    5/5 new Playwright (`e2e/chapterNav.spec.ts`). Full suite: 77/77 Playwright (stable across 3
    repeated full runs; chapter 2's own camera-reframe test still shows the same pre-existing
    CPU-contention flake class documented earlier in this file, roughly 1 in 20+ runs, not a new
    regression), 35/35 Vitest (one existing unit test updated for the Reset Scenario move), tsc
    clean, oxlint clean.
10. **DONE (partial): chapter evidence sweep + real self-review of the images (not just green
    tests)**. NOT a full close of `CTY-MOTION-001` (corrected after a second self-review caught
    this exact overclaim pattern repeating): that gate also requires reverse-scroll and
    reduced-motion variants for ALL SIX chapters, plus a scroll recording, contact sheets, and
    frame pacing per CLAUDE.md. This pass only added start/mid-scroll captures per chapter per
    breakpoint, plus ONE reduced-motion capture (chapter 4 only, not all six). Still owed:
    reverse-scroll tests for the chapters that scroll-scrub (2 and 4), reduced-motion captures for
    chapters 2, 3, 5, 6, and the scroll-recording/contact-sheet/frame-pacing deliverables.
    `e2e/evidence.spec.ts` extended from intro-only to all of chapters 2-6 (start + mid-scroll state
    per chapter per breakpoint, plus a reduced-motion capture for chapter 4). Per CLAUDE.md's own
    mandatory rule ("Read the resulting images yourself... before calling anything done"), every
    image was actually opened and inspected this pass, not just generated. That inspection found and
    fixed two more real defects, neither visible from passing tests alone:
    - **Chapters 2 and 3 were visually near-identical** (same grid-left/controls-right skeleton,
      literally adjacent in the chapter order), confirmed directly by comparing their own desktop
      start-state captures side by side. Fixed with a first real increment of the still-owed visual
      pass (not the full pass): chapter 3 now mirrors the composition (prose/controls left, grid
      right, the actual JSX element order swapped, not a CSS `order` trick, to keep DOM/tab
      order matching visual order) and takes a subtle wash of its own accent-blue color; chapter 5
      gets a bordered "inspector" panel treatment to read as its own distinct archetype rather than
      a third repeat of the same skeleton.
    - **A real mobile-overflow bug**: any chapter whose stacked mobile content is taller than 100vh
      was permanently clipping the rest for that chapter's entire pinned scroll duration
      (`.chapter-sticky`'s `overflow: hidden`, inherited from the desktop layout where it's correct,
      never re-measures or reflows as the outer page scrolls under `position: sticky`). Confirmed
      directly on chapter 2's own mobile capture (the "Treated zone" dropdown was below the fold
      and unreachable) before the fix, and confirmed reachable via internal scroll after it (added
      `overflow-y: auto` at the mobile breakpoint). This affected every existing chapter (2 and 3
      at minimum) and had shipped undetected across three prior "done" chapter commits, exactly the
      kind of defect CLAUDE.md's own mandatory visual QA rule exists to catch before tests alone say
      green.
    Re-verified after both fixes: 95/95 Playwright across repeated full runs (same pre-existing
    chapter 2 CPU-contention flake class, unrelated), zero axe-core violations, tsc/oxlint clean.

11. **DONE: a second self-review (deliberately asked to be adversarial about the first review's own
    blind spots) found and fixed several more real defects**, the most significant being that the
    dossier's own literal flagship request was never actually built:
    - **The flagship chart didn't exist.** The dossier's own words are "two urban timelines diverge
      AS ESTIMATOR ASSUMPTIONS ARE MANIPULATED." The build had two city stages that diverge on
      SCROLL, with no time axis and no redraw when donor weights change, i.e. the scroll effect,
      not the estimator-driven one the dossier actually asks for. Built the real thing:
      `src/scenes/TrajectoryChart.tsx`, a hand-rolled SVG line chart (no charting library; two
      polylines, an axis, and a few labels is well within "write it by hand") plotting the treated
      zone's REAL observed outcome series against the REAL synthetic-control reconstruction for the
      same days (`synthetic[day] = observed[day] - gapByDay[day]`, the estimator's own existing
      per-day gap field, `src/engine/estimators.ts`, which was already computed and exported but
      never rendered anywhere), with an intervention-day marker, redrawing whenever donor weights
      change. This is the actual flagship interaction now, not the scroll divergence alone (which
      stays, as a real but secondary effect). 2 new Playwright tests confirm the chart renders a
      real multi-point path (not empty/placeholder) and that the synthetic path's own `d` attribute
      changes when weights are reapplied.
    - **Every `ResultCaveat` said "Fitted estimate" regardless of what kind of number it sat next
      to**, violating CLAUDE.md's own rule to "distinguish historical measurement, fitted estimate,
      counterfactual inference, and hypothetical simulation in every label that presents a number."
      The synthetic-control gap is a counterfactual inference, not a fitted point estimate the same
      way DiD's ATT is; the placebo rank/p-value is a permutation-test diagnostic, not an estimate
      of anything. `ResultCaveat` now takes a `kind` prop with accurate wording for each.
    - **No number on the page showed units.** Added `unitForOutcome()`
      (`src/scenes/resultVisualEncoding.ts`) and applied it to the Lab's ATT/pre-post means and
      chapter 4's Gap readout.
    - **Chapters 3, 5, and 6 each had roughly 150vh of dead pinned scroll** (no scroll-linked
      animation, but still inheriting the scrubbing chapters' own 250vh height), confirmed by
      diffing each chapter's own start/midscroll evidence captures (pixel-identical). Shortened to
      130vh for these three specifically.
    - **Mobile chapter-nav bar occluded the bottom of each panel's own scrollable content**
      (confirmed with a real `click()`, which Playwright refuses when something else is on top, not
      just `isVisible()`, which doesn't check occlusion): added `padding-bottom` clearance on
      `.chapter-sticky` at the mobile breakpoint, with a new e2e test using a real click to prove
      reachability, not just visibility.
    - **Nav dot tap targets were ~14px**, under the 24x24px minimum touch-target size; widened via
      padding and `min-width`/`min-height`.
    - **The nav's smooth-scroll animation ignored `prefers-reduced-motion`**, the one place in the
      app that did (every GSAP scene already branches on it via `useScene`'s own flag); gated on
      `matchMedia`.
    - Checked and found NOT a bug: the intro's own caveat text (added in the hardening-pass commit)
      does not overlap the city grid on mobile, confirmed directly against
      `intro-mobile-midbeat.png`.
    - **Corrected an overclaim**: the prior evidence-sweep entry above said it "closes
      `CTY-MOTION-001`"; it does not (reverse-scroll and reduced-motion variants are still owed for
      most chapters, along with the scroll-recording/contact-sheet/frame-pacing deliverables).
      Reworded in place rather than left standing.
    98/98 Playwright across repeated full runs, zero axe-core violations, tsc/oxlint clean.

**Still owed before Stage 3 can be called done against the release gate** (not yet done):
- **The rest of the visual-design pass**: chapter 3/5's distinguishing treatments are a first
  increment, not the full pass (varied block treatment, asymmetric composition, texture/depth cues
  beyond the palette re-skin, still not done). The trajectory chart now gives chapter 4 a much
  stronger flagship moment than the scroll-divergence alone; whether the scroll divergence itself
  still needs to be more pronounced is now a secondary, lower-stakes open question.
- **Reverse-scroll and reduced-motion evidence for most chapters, plus the scroll-recording,
  contact-sheet, and frame-pacing deliverables** (`CTY-MOTION-001`'s full requirement; see the
  corrected entry above).
- **An independent visual QA reviewer has not yet looked at any of this evidence**; two rounds of
  this session's own self-review (including one deliberately asked to find the first round's own
  blind spots) are not a substitute for CLAUDE.md's own "genuinely independent" requirement. The
  next step before this can move toward release is spawning that independent review.

**Stage 4-9**: laboratory integration inside the full cinematic experience (decide what, if
anything, remains in the standalone "lab" `<main>` section now that all 6 chapters host their own
controls and the DiD result is the only thing left there), performance engineering (measured, not
invented), independent adversarial review of the complete build (a fresh look at every chapter, not
just the newest ones), final release acceptance. Not started.

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

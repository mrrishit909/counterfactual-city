# Stage 2: Independent Review of the Cinematic Vertical Slice

A fresh reviewer with no access to this session's own notes reviewed the Stage 2 intro slice
before any further chapter work began, per the build directive's own instruction ("Do not build
all 6 chapters until this slice is independently verified").

**Initial verdict: SLICE NOT SOUND.** Three blocking defects found. All three have since been
fixed and independently re-verified (by this session, with reproduce-before-fix discipline on
all three, not just a visual spot check). The underlying scroll/camera architecture itself
(CSS sticky + scrub-bound GSAP timeline + the shared `useScene.ts` lifecycle wrapper) was found
sound and is unchanged.

## Blocking defects found, and the fix for each

**1. Error state was a dead end.** `IntroSequence.tsx` handled `load.status === "loading"` and
`"error"` identically, with the same permanent message and no retry, and critically never
rendered `children` (the lab) in either case, so a fetch failure made the entire app unreachable.
Confirmed live by the reviewer (routed `panel.json` to `abort()`, page stuck on "Loading city
data..." forever, 0 buttons).

Fix: stopped gating `children` behind the intro's own readiness. The intro's cinematic visuals
render only when `load.status === "ready"`, but the lab (which has its own correct, pre-existing
error branch against the same shared `ScenarioContext`) now always renders underneath, regardless
of the intro's own status. A new regression test (`e2e/intro.spec.ts`, "a panel-fetch failure does
not trap the lab...") routes the fetch to fail and confirms the lab's real error message appears;
confirmed to fail against the pre-fix code before confirming it passes against the fix.

**2. Skip Intro was a no-op under reduced motion.** The scroll-target formula
(`rect.bottom - window.innerHeight`) is 0 whenever the intro section is exactly one viewport tall,
which is exactly what `scenes.css` sets it to under `prefers-reduced-motion: reduce`. Confirmed
live by the reviewer (clicked Skip Intro in a reduced-motion context, `scrollY` unchanged).

Fix: `handleSkip` now checks `prefers-reduced-motion` directly and, when reduced, targets
`scrollY + rect.bottom` (scroll past the section's bottom edge entirely, correct for a normal-flow
non-sticky layout) instead of the sticky-case formula (correct only when there's a sticky stage to
detach from). A new regression test confirms `scrollY` actually increases after clicking Skip
Intro under `reducedMotion: 'reduce'`; confirmed to fail against the pre-fix code first.

**3. The camera pushed the treated zone off-screen instead of centering it.** Two layers of bug,
found in sequence:
- First layer: a CSS-percentage `transformOrigin` on an SVG `<g>` resolves against that element's
  own `getBBox()`, not the SVG's `viewBox`, but the percentage was computed against the viewBox
  dimensions. Tried fixing with GSAP's `svgOrigin` (viewBox-space coordinates directly), which
  improved but did not fully fix it.
- Second, deeper layer, found by this session while verifying the `svgOrigin` fix: scaling around
  a fixed origin point keeps that POINT stationary on screen, it does not move it to the
  viewport's center. The treated zone's own center was always going to be wherever it already was,
  no matter what origin was used, as long as the approach was "scale around a point."
- Real fix: animate the root `<svg>` element's own `viewBox` attribute directly (a true pan+zoom).
  The new viewBox literally IS the visible region, so there is no transform-origin math at all.

Confirmed by direct measurement at each step: pre-fix, the treated zone's block had
`rect.bottom = -104.9` (entirely above the viewport); after the `svgOrigin`-only fix,
`rect.bottom = -73.4` (still entirely off-screen, confirming the second bug was real and
independent of the first); after the `viewBox` fix, the block is on screen and visually centered
(confirmed both by a tightened regression test, reverted and re-run to prove it fails pre-fix and
passes post-fix, and by opening a live screenshot and looking at it).

## Non-blocking findings, also fixed in the same pass

- The treated zone's stroke/pulse-ring color was hardcoded red (`var(--accent-red)`) regardless of
  the real effect's sign, so a positive (blue-fill) result still got a red halo. Fixed: stroke and
  pulse ring now use the same computed color as the fill (`src/scenes/CityStage.tsx`).
- `encodeResult`'s pulse-intensity scale was a single hardcoded value (300), calibrated implicitly
  for `trip_volume`; `avg_speed_kmh`'s pulse would have read as near-invisible. Fixed: a per-outcome
  scale table (`defaultScaleForOutcome` in `resultVisualEncoding.ts`), each ~1.67x the outcome's own
  true injected effect.
- `execution/PROGRESS.md` still listed `CTY-MOTION-001` as `unstarted` after
  `specifications/REQUIREMENTS.yaml` had already updated it to `implemented`; reconciled.

## Not fixed: the honest visual-quality finding

The reviewer's blunt assessment: the current intro "reads as a wireframe, not a finished cinematic
city... a uniform grid of identical flat gray rounded rectangles... no skyline, no depth, no
texture... directly contradicts the project's own stated visual identity." This is correct and is
NOT fixed by this pass. `docs/ART_DIRECTION.md` section 1 already flagged the dark placeholder
palette as needing a Stage 3 re-skin before this verdict was in hand; this review confirms the gap
is larger than palette alone; a real design pass (varied block treatment, asymmetric composition,
texture, the dossier's own "architectural editorial" language) is still owed, not a bug to fix in
code, a creative-direction task for Stage 3's own build.

## What held up without changes

State ownership, async safety, all 6 lab controls, reverse-scroll and fast-jump determinism
(independently re-confirmed by the reviewer for both beat A and beat C), Skip Intro under normal
motion (confirmed pixel-exact), reduced motion's non-skip path, zero axe-core violations, zero
horizontal overflow at all 3 breakpoints, and the CSS-sticky (not GSAP pin) architecture itself.

## Status

All 3 blocking defects and all 3 non-blocking findings fixed and verified (35/35 Playwright, 35/35
Vitest, 25/25 pytest, tsc clean, oxlint clean) by this session, with reproduce-before-fix evidence
for each of the 3 blocking items specifically. This fix pass has not itself been re-reviewed by a
separate, fresh reviewer; `specifications/REQUIREMENTS.yaml`'s `CTY-MOTION-001` is therefore left
at `implemented`, not advanced to `independently verified`, until that happens (planned alongside
the Stage 8 adversarial review of the complete build, not necessarily as its own separate pass).
The visual-quality gap is carried forward into Stage 3 as explicit, tracked work, not silently
dropped.

# Architecture

## The persistent stage, one component per chapter

`src/scenes/CityStage.tsx` renders the 24-zone city grid as SVG (`src/scenes/cityLayout.ts` computes
the grid positions and road segments). Per `docs/ART_DIRECTION.md` section 7 item 1 ("one persistent
visual language, not one DOM node"), each of the intro and the 6 chapters mounts its OWN `CityStage`
instance (not one shared DOM node migrated between chapters): the same visual language throughout
(same palette, same grid, same zone-coloring convention), but a separately-rendered SVG per section,
scoped by a required `instanceId` prop that prefixes every `data-testid` (`${instanceId}-city-stage`,
`${instanceId}-city-zone-${zone}`) so multiple mounted instances never collide.

This was a deliberate revision of an earlier, stricter "single shared stage node" plan, changed
specifically because the stricter version would have required redesigning chapters 2/3's
already-independently-verified sticky-section architecture, which the project's own build directive
forbids re-litigating once verified.

## Scroll-driven motion: CSS `position: sticky`, not GSAP's `pin: true`

Every chapter is an outer wrapper (`.chapter`, 250vh for chapters with a scroll-scrubbed camera, 130vh
for chapters 3/5/6 which have none) with an inner `.chapter-sticky` panel (`position: sticky; top: 0;
height: 100vh`). `GSAP ScrollTrigger` reads scroll progress against this wrapper to drive a scrub
timeline; it never uses `pin: true`. This was a deliberate, confirmed-by-direct-inspection choice: an
earlier `pin: true` + relative-percentage-`end` attempt produced a pin-spacer with zero added height,
trapping scroll with no way to reach the content below. Plain CSS sticky, with ScrollTrigger reading
progress only, has no such failure mode and is the pattern every scroll-driven section in this project
uses.

## Shared GSAP lifecycle: `useScene`

`src/scenes/useScene.ts` is the single entry point every chapter/intro-beat scene uses to register a
GSAP timeline bound to its own `ScrollTrigger`; no scene calls `useGSAP`, `gsap.context`, or
`ScrollTrigger.create` directly. It guarantees:

- **No duplicate triggers.** Every `setup()` call kills any existing `ScrollTrigger` whose `id` starts
  with that scene's own `sceneId` before creating a new one, so a duplicate invocation (e.g. under
  React StrictMode in dev) converges to exactly one trigger instead of accumulating.
- **Explicit unmount cleanup.** A plain `useEffect` cleanup kills every `ScrollTrigger` tagged with the
  scene's `sceneId` on unmount, rather than relying on `useGSAP`'s own built-in cleanup, which was
  found (by tracing GSAP's own source) to take a "soft revert" path that does not reliably remove a
  `ScrollTrigger`.
- **Ref-timing safety.** If a scene's `scopeRef` isn't attached yet when `setup()` would run (a real,
  confirmed React 19 timing gap, not a JSX-ordering mistake), the wrapper retries on the next animation
  frame, bounded and cancelled on unmount.
- **`reducedMotion` is passed into `setup()`**, not handled by this wrapper itself, so each scene
  chooses its own meaningful static end state rather than motion being silently skipped.

Ported directly from CASCADIA's own verified implementation (project #1 of this Atlas), per the
build directive's instruction to reuse verified infrastructure rather than re-derive it.

## One global re-measurement point: `IntroSequence`

Every chapter's own `ScrollTrigger` measures its start/end document offsets at mount time, which
happens synchronously, before the app's async scenario-data fetch resolves. A real bug was found live
building chapter 4: that first measurement pass can land short of a trigger's real position, trapping
its scrub permanently at an incorrect state. The fix is one explicit `ScrollTrigger.refresh()` call,
in `IntroSequence.tsx`, fired when `load.status` becomes `"ready"`, the single place every chapter's
trigger re-validates against the page's final layout, rather than each chapter working around the
problem independently via an unrelated dependency-array trick (an earlier, coincidental fix that was
replaced with this root-cause one).

## Scenario state vs. presentation state

`src/engine/ScenarioContext.tsx` owns the ONE analytical scenario (intervention date, treated zone,
control pool, donor weights, outcome, placebo/pretrend results) behind `useScenario()`. This state is
deliberately kept separate from any chapter's own camera/animation state (GSAP timelines, scroll
position): no chapter mutates `ScenarioContext` as a side effect of scrolling, and no control mutates
GSAP state directly. `e2e/controls.spec.ts`'s own "functional scenario consistency while scrolling"
test confirms custom scenario state set before a full scroll pass through every chapter survives
unperturbed.

`scenario` itself is never `null` to a consuming component even before the panel fetch resolves: a
fallback default scenario object (`scenario ?? {...}` in `ScenarioContext.tsx`) lets every chapter
render safely at any load state, rather than every chapter needing its own null guard.

## Chapter navigation

`src/scenes/ChapterNav.tsx` is a fixed index (desktop/tablet: a right-anchored dot rail; mobile: a
bottom bar), built on `useActiveChapter` (`src/scenes/useActiveChapter.ts`, an `IntersectionObserver`
-based hook, ported from CASCADIA, not scroll-event-based). It also hosts Reset Scenario, the one
control every other control's own undo path depends on, made reachable from anywhere on the page
rather than requiring a scroll to a specific section.

## The DiD result lives where its controls live

There is no standalone "results panel" or "lab" section separate from the 6 chapters. The
difference-in-differences result (`src/scenes/DiDResultPanel.tsx`) is rendered inside chapter 2, next
to CTY-INT-001/002 (the controls that drive it), not several chapters and a full scroll away. An
earlier architecture had a standalone results section at the very bottom of the page; it was removed
once this project had migrated every control into its own chapter, since a results panel at the
bottom of the page no longer satisfied "the changed quantity is visibly explained" for the controls
driving it.

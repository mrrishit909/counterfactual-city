# Motion System

All scroll-driven motion uses GSAP `ScrollTrigger` with `scrub: 1` (a true function of scroll
position, not a one-way state machine), via the shared `useScene` wrapper (see `ARCHITECTURE.md`).
Nothing is pinned with GSAP's own `pin: true`; CSS `position: sticky` holds each section's visible
panel in place while `ScrollTrigger` reads progress only.

## Intro (3 beats)

1. **Street grid draws in** (`stroke-dashoffset` on each road segment animates to `0`).
2. **Zone labels resolve** (title/disclaimer fade in).
3. **Camera pushes toward the treated zone**: the SVG's own `viewBox` attribute is animated directly
   (`gsap.fromTo(stage, {attr:{viewBox: base}}, {attr:{viewBox: zoomed}})`), a true pan+zoom. An
   earlier attempt used CSS `transform-origin`/GSAP's `svgOrigin`, found to have two layered bugs: a
   bbox-vs-viewBox coordinate mismatch, and a deeper conceptual gap (scaling around a fixed point
   keeps that point stationary on screen, it does not recenter it). Animating `viewBox` directly has
   neither problem. The treated zone's color/pulse resolves to the REAL current DiD result during this
   beat (`src/scenes/resultVisualEncoding.ts`), never a placeholder.

**Reduced motion**: lands directly on the final, zoomed-in framed view; Skip Intro computes its real
scroll target from the live (not stale, not pinned) document position of the next section.

## Chapter 2 ("treatment")

Camera push-in on the treated zone (same `viewBox`-animation technique as the intro's own beat 3),
re-triggered whenever the treated zone changes (dependency array `[scenario.treatedZone]`).

## Chapter 3 ("matched controls")

No scroll-scrubbed camera: the whole grid stays in frame throughout, a deliberate choice since the
point of this chapter is comparing many zones at once. The `Sparkline` comparative-trajectories strip
redraws when the control pool or treated zone changes, not on scroll.

## Chapter 4 ("counterfactual", the flagship)

Two independently-mounted `CityStage` instances translate apart on scroll (`xPercent: -22` /
`+22`, GSAP scrub timeline). This was increased from an original `±6`, found live to be under 10px of
actual movement on a ~320px-wide stage, imperceptible for the dossier's own "two urban timelines
diverge" billing. The `TrajectoryChart` (observed vs. synthetic series) redraws whenever donor weights
change, independent of scroll position: the real "as estimator assumptions are manipulated" motion the
dossier asks for is this chart's own redraw, not the scroll-tied stage separation, which is a
secondary visual cue.

## Chapter 5 ("diagnostics")

No scroll-scrubbed camera (same reasoning as chapter 3). The `EvidenceBands` chart renders only after
a real placebo-test computation completes (a user-triggered action, not auto-recomputed on scroll or
on every scenario change, matching the dossier's own "launch placebo" framing).

## Chapter 6 ("limitations")

No scroll-scrubbed camera.

## Reduced motion

Every scene's own `setup()` function receives a `reducedMotion` flag from `useScene` and branches
explicitly: it sets the scrubbed property directly to its final value (no animation), rather than this
being handled generically by the wrapper. This means each scene's own reduced-motion end state is
chosen deliberately (e.g. chapter 4's two stages land already separated at `xPercent: ±22`), not
derived automatically. `ChapterNav`'s own smooth-scroll (triggered by clicking a nav dot) is similarly
gated: `behavior: reducedMotion ? "auto" : "smooth"`.

## Measured frame pacing

`e2e/evidence-harness.spec.ts` hooks `requestAnimationFrame` during a real, continuous scroll pass
through chapter 4's own scrub animation, against the production preview build (not a dev server, not
an idle page). Latest measurement (`verification/FRAME_PACING.json`): mean frame time 16.64ms
(~60.1fps), p95 18.4ms, 0 frames worse than a 30fps threshold. Measured on one chapter, one
breakpoint, one local machine; not yet a full per-chapter/per-breakpoint budget (see `LIMITATIONS.md`).

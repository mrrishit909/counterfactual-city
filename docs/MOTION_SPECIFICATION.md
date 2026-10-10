# Motion Specification

Companion to `docs/ART_DIRECTION.md` section 7 (motion rules) and section 5 (chapter plan). This
file gives the per-chapter trigger/timeline detail that section wasn't the place for.

## Shared mechanics (already built, Stage 2)

- `src/scenes/gsapSetup.ts`: one-time plugin registration (ScrollTrigger only; no DrawSVGPlugin,
  unlike CASCADIA, nothing in this project's planned chapters needs a path-draw effect beyond the
  intro's own road draw-in, which uses plain `stroke-dashoffset`, not the plugin).
- `src/scenes/useScene.ts`: the shared lifecycle wrapper (ported from CASCADIA). Every future
  chapter's own scroll animation MUST go through this, never a direct `ScrollTrigger.create` call.
- Persistent stage: CSS `position: sticky` (`.intro-sticky` today; chapters 2-6 should reuse the
  same sticky-stage pattern, not GSAP `pin: true`, see the documented bug this session found and
  fixed in `execution/PROGRESS.md`'s decision log).

## Per-chapter motion (trigger, drives, reverse, reduced motion)

| Ch | Trigger | Drives | Reverse | Reduced motion |
|---|---|---|---|---|
| 1 Observed world | Scroll into section (scrub) | Camera framing (full grid), title | Scrub is inherently reversible | Instant full-grid framing |
| 2 treatment | Scroll into section (scrub) | Camera frames the selectable zone grid; control panel fades in | Scrub reversible | Controls visible immediately, no pan |
| 3 matched controls | Scroll into section (scrub) + control pool selection (state-driven) | Camera frames 3-column comparative layout | Scrub reversible; selection changes are instant (not scroll-tied) | Comparative layout shown directly |
| 4 counterfactual (flagship) | Scroll into section (scrub) for the split transition; weight slider changes (state-driven) for the live gap | Grid splits into two drawn-apart halves; gap readout updates on real computation, never interpolated | Scrub reversible for the split; weight changes simply recompute (no animation to reverse) | Split shown in its final drawn-apart state instantly |
| 5 diagnostics | Scroll into section (scrub) for framing; "Run placebo test" button (state-driven) for the result | Camera frames inspector layout; result list fades in on computation complete | Scrub reversible; placebo re-run is idempotent | Inspector layout shown directly |
| 6 limitations | Scroll into section (scrub) | Camera pulls back to a smaller grid inset, text prose takes the majority of the frame | Scrub reversible | Final pulled-back framing shown directly |

## Global rules (restated from ART_DIRECTION.md section 7, load-bearing, do not relax)

1. No count-up numbers; values swap on real computation completion.
2. Data drives animation, never the reverse (an effect's sign/magnitude decides color and intensity,
   per `src/scenes/resultVisualEncoding.ts`'s existing pattern, reused for every chapter's own
   result, not just the intro's).
3. One persistent grid stage, never torn down and remounted between chapters.
4. Every chapter defines entry, exit, and reverse explicitly through `useScene.ts`.
5. Reduced motion swaps every chapter to its instant final state; this is already proven out in
   Stage 2 and the pattern (an early return in each scene's `setup()` callback) is the one to copy.

# Responsive Compositions

Companion to `docs/ART_DIRECTION.md` section 6, which already has the per-chapter breakpoint table.
This file records the verification method and what's already proven versus still pending.

## Required breakpoints (per the portfolio-wide release gate and this project's own CLAUDE.md)

- Desktop: 1440x900
- Tablet: 768x1024
- Mobile: 390x844

## What's already verified (Stage 2, intro only)

`e2e/intro.spec.ts`'s `responsive viewports` describe block checks, at all 3 breakpoints, that the
city stage renders with no horizontal overflow. `verification/SCREENSHOTS/intro-{desktop,tablet,
mobile}-{start,midbeat,handoff}.png` were generated and visually opened/confirmed (not just
generated) during Stage 2's build.

`e2e/smoke.spec.ts`'s `responsive viewports` block does the same for the Lab (the 6-control panel),
predating Stage 2.

## What's still pending (Stage 3+, once chapters 2-6 exist)

Each chapter needs its own 3-breakpoint screenshot set, generated and VISUALLY opened (not merely
asserted not to overflow), per `docs/ART_DIRECTION.md` section 6's specific per-chapter layout
compositions (e.g. chapter 4's flagship split going side-by-side on desktop vs. stacked on mobile is
a deliberate, different composition, not a reflow, and must be confirmed as such by an actual
screenshot, not inferred from the CSS).

## Method (reuse, don't re-derive)

1. Extend `e2e/intro.spec.ts`'s (or a new chapter-specific) `responsive viewports` pattern: set
   viewport, navigate/scroll to the chapter, assert no horizontal overflow via
   `document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`.
2. Add a screenshot capture (the existing `e2e/evidence.spec.ts` pattern) per chapter per
   breakpoint.
3. Open and look at every screenshot before marking a chapter's responsive composition done, per
   this account's own standing rule ("the most important safeguard against ... technically
   functional websites that still look ordinary" / "Never approve visual quality without inspecting
   actual browser output").

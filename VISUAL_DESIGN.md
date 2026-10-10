# Visual Design

## Palette

Defined in `src/App.css`'s `:root`:

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f3f0e8` | Page/panel background |
| `--ink` | `#1c1c1a` | Primary text, borders |
| `--accent-red` | `#d65343` | Negative-effect encoding, decorative accents, non-text uses |
| `--accent-red-text` | `#9c2f20` | Red TEXT on `--paper` (darkened for WCAG AA; `--accent-red` itself is only 3.56:1, a real axe-core finding) |
| `--accent-blue` | `#4b84c5` | Positive-effect encoding |
| `--hint` | `#55534c` | Secondary/muted text |
| `--hairline` | `#d8d4c8` | Borders, road lines |

This is the dossier's own specified identity (architectural editorial, map grids, asymmetric
composition), re-skinned from an earlier dark placeholder used only to prove out the scroll/camera
architecture before any chapter content existed.

## Chapter archetypes (per `docs/ART_DIRECTION.md` section 5)

No two adjacent chapters share an archetype or a layout skeleton:

1. **Intro ("observed world")**, immersive full-bleed canvas, no control.
2. **Chapter 2 ("treatment")**, editorial split: grid left, controls + the DiD result right.
3. **Chapter 3 ("matched controls")**, mirrored split (controls left, grid right) with a subtle
   accent-blue wash, plus a real comparative-trajectories strip (`src/scenes/Sparkline.tsx`): up to 3
   control-pool zones' own outcome series plotted against the treated zone's, on a shared y-domain.
   This was rebuilt after an early version (a straight mirror + recolor of chapter 2's own skeleton)
   was judged, correctly, as "a different color on the same shape," not a distinct archetype.
4. **Chapter 4 ("counterfactual", the flagship)**, two independently-mounted `CityStage` instances
   that visually diverge on scroll (`xPercent: ±22`, increased from an original `±6` found to be
   imperceptible), plus the real flagship chart: `src/scenes/TrajectoryChart.tsx`, the treated zone's
   observed outcome series against the synthetic-control reconstruction for the same days, with an
   intervention-day marker.
5. **Chapter 5 ("diagnostics")**, an asymmetric split (smaller grid, wider console) with an inverted
   dark "diagnostic console" panel (`var(--ink)` background, `var(--paper)` text, monospace numeric
   readouts), the one chapter on the page that isn't paper-on-ink. Hosts
   `src/scenes/EvidenceBands.tsx`: every placebo unit's effect plotted as a dot on a shared axis, the
   treated zone's own real effect highlighted, a null-distribution visualization. This chapter was
   also rebuilt once (an earlier version was a plain bordered variant of chapter 2's skeleton,
   flagged as the project's weakest remaining distinctiveness gap).
6. **Chapter 6 ("limitations")**, text-led: methodology/limitations prose left, a small grid + the
   outcome control right on desktop; grid-first, then prose, on mobile/tablet.

## Result labeling

Every number on the page is labeled by the kind of claim it represents
(`src/scenes/ResultCaveat.tsx`'s own `kind` prop: `fitted-estimate`, `counterfactual-gap`,
`permutation-diagnostic`), with a one-line caveat placed directly adjacent to it pointing to chapter
6's own full identification-assumptions explanation (parallel trends, no interference, no
anticipation), per the dossier's own hard rule: never present a counterfactual inference as
unconditional fact, and the caveat belongs next to the result, not buried in a footer.

## A real scaffold bug, found and fixed

`src/index.css` was leftover, never-reviewed Vite template CSS (confirmed via grep: none of its own
custom properties or selectors were referenced anywhere in the real app). Its own `h1, h2 { color:
var(--text-h) }` rule (a near-black distinct from this app's own `--ink`) had been silently coloring
every chapter heading this entire build; invisible on the light paper background (both read as
"basically black"), until chapter 5's own intentional dark panel exposed it as a genuine 1.18:1
contrast failure. Its `@media (prefers-color-scheme: dark)` block (an OS-level dark-mode flip this
app never designed around) was removed along with the heading-color rule; only the structural rules
the project's own layout (`#root` width) and chapter 6's own `<code>` element actually depend on were
kept.

# THE COUNTERFACTUAL CITY: Art Direction

Owner: this build session, Stage 2/3 handoff. Tokens: `docs/DESIGN_SYSTEM.json`. Inputs read:
`docs/PROJECT_SPEC.md` (dossier), `docs/VISUAL_REFERENCE_RESEARCH.md` (live inspection of
everswap.com and enpowertrading.co.za), `~/cascadia/docs/ART_DIRECTION.md` (sibling project's own
board, read for discipline/format, not copied for content: CASCADIA's palette, metaphor, and
network-diagram visual language belong to CASCADIA; this project's own dossier palette and spatial
metaphor are different and are what's used here).

**Brief in one line.** An editorial map of a city that can be rewound and replayed: a flat,
architectural street grid on warm paper, where a single policy choice visibly forks the city's own
future into two drawn-apart halves. Light is evidence, not atmosphere: a zone glows only in
proportion to a real computed effect, never as decoration.

**Governing idea: the ledger, not the hologram.** Everswap and Enpower both earn their craft through
restraint (one glyph reused everywhere, one data-card format repeated six times, a persistent
chapter bar) rather than through density. This project's governing idea borrows that restraint:
one city, drawn once, that the chapters reframe and recompute, never a new illustration per chapter.
The dossier's own palette (`#F3F0E8` paper, `#D65343` red, `#4B84C5` blue) is architectural and
editorial, closer to Enpower's light, map-grid mood than to Everswap's dark DeFi one; CASCADIA
already occupies the "engraved dark plate" territory this project deliberately does not repeat.

---

## 1. What's already built (Stage 2) and what this board governs going forward

Stage 2 shipped a first-pass intro (`src/scenes/IntroSequence.tsx`, `CityStage.tsx`): a dark
(`#1c1c1a`) scene with a 24-block grid city. That dark background was a reasonable placeholder to
prove the scroll/camera/real-result architecture (and it did: Stage 1 and Stage 2 both passed
independent review), but it does NOT yet reflect this board's governing idea above, which calls for
the dossier's own light paper palette, not a dark DeFi-adjacent one. **This board's first load-bearing
instruction for Stage 3: re-skin the persistent city stage to the light palette below before or
while building chapter content**, not after six chapters have already been built on the wrong
palette.

---

## 2. Palette (from the dossier, p.10 "Visual identity")

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#F3F0E8` | Page background, the "map paper." Already used in the Lab's own CSS. |
| `--ink` | `#1C1C1A` | Primary text, line work. Already used. |
| `--accent-red` | `#D65343` | The treated zone / negative-effect encoding. Already used (decorative uses) and `--accent-red-text` (`#9C2F20`, WCAG-AA-safe) for text, both already in `src/App.css`. |
| `--accent-blue` | `#4B84C5` | Control zones / positive-effect encoding / the "baseline" timeline in the flagship fork visualization. |

No new color tokens are needed for Stage 3; the existing `src/App.css` tokens are reused, extended
only with mid-tones derived from them (tints/shades for road lines, block fills, hover states) rather
than new hues, keeping the "one warm, one cool" two-channel encoding CASCADIA's own board also
settled on for an unrelated reason (it is simply the right way to show a before/after fork legibly).

## 3. Typography

No new typeface is adopted. The Lab already uses the system UI sans stack
(`ui-sans-serif, system-ui, sans-serif`), which matches the dossier's own "neutral typography"
instruction (p.10: "asymmetric editorial grid, carefully controlled negative space ... neutral
typography", as opposed to CASCADIA's condensed technical display face). Adding a custom webfont
would be a real LCP cost (CASCADIA measured and documented this exact tradeoff); the dossier does not
ask for a distinctive display face the way it asks for a distinctive spatial metaphor, so none is
added. Open item: if Stage 3/4 QA finds the system stack reads as generic in practice, revisit with a
single variable font (one file, one request), not before.

## 4. The spatial metaphor: a street grid, not a network diagram

CASCADIA's network (nodes + edges, force-directed-feeling layout) is the right metaphor for an
electrical grid. This project's metaphor is a **city block grid with streets**, already built in
`src/scenes/cityLayout.ts` (a plain rectangular grid, not force-directed), which is the correct
choice for "zones" (the dossier's own unit: `analysis/data/synthetic_panel.py`'s 24 zones) rather
than point-like network nodes. Keep this grid metaphor through all 6 chapters; do not introduce a
competing visual metaphor (e.g. a map/globe, a dashboard of charts) per chapter, the same "one
persistent stage" discipline CASCADIA's own board states as a hard rule and this project's own
`IntroSequence.tsx` header comment already commits to.

**The flagship interaction's own metaphor** (dossier: "Two urban timelines diverge as estimator
assumptions are manipulated"): when the user reaches chapter 4 (counterfactual, CTY-INT-004, adjust
synthetic-control weights), the single grid should visually **split into two ghosted, drawn-apart
copies** of itself, one tinted red-leaning (observed/treated path) and one blue-leaning (synthetic
counterfactual path), their treated-zone blocks diverging in height/intensity in proportion to the
real computed gap (`SyntheticControlResult.attPostMean`, already computed in
`src/engine/estimators.ts`). This is the project's own "signature flagship interaction" per the
dossier and should get the most deliberate motion/visual investment of the 6 chapters, the same way
CASCADIA's own board over-invests in chapter 4's single-transition fracture.

## 5. Six-chapter plan (mapping dossier chapters to existing controls)

The dossier gives two chapter-name lists that are "not reliably alignable 1:1 by wording alone"
(`docs/PROJECT_SPEC.md`). This plan reconciles them by READING BOTH and matching by what each
control actually does, not by position, per the dossier's own instruction.

| # | Dossier chapter | Archetype | Hosts | Why |
|---|---|---|---|---|
| 1 | Observed world | **Immersive canvas** | none (establishing) | The baseline city, full-bleed, exactly what Stage 2's intro already is, minus the dark palette. No control yet, matching CASCADIA ch1's "establishing shot, no control". |
| 2 | treatment | **Editorial split** | CTY-INT-001 (intervention date), CTY-INT-002 (treated zone) | Dossier control 1 ("change intervention date > rebuild post-period > treatment graph") and control 2 ("select treatment area > update group > map") both describe choosing WHAT is treated and WHEN, i.e. "treatment" as a chapter is defining the intervention, not yet comparing outcomes. |
| 3 | matched controls | **Comparative view** | CTY-INT-003 (control pool) | Dossier control 3: "choose control pool > re-estimate > comparative trajectories", literally matched controls. |
| 4 | counterfactual | **Flagship split** | CTY-INT-004 (adjust weights) | Dossier control 4: "set weights > synthetic reconstruction > gap", literally the counterfactual reconstruction. This is the flagship interaction (section 4 above). |
| 5 | diagnostics | **Focused inspector** | CTY-INT-005 (placebo) | Dossier control 5: "launch placebo > null distribution > evidence bands", literally a diagnostic. |
| 6 | limitations | **Editorial, text-led** | CTY-INT-006 (change outcome) + explicit methodology/limitations copy | Dossier control 6 ("change outcome > reload compatible series > effect estimate") is the least visually distinctive control, pairing it with the mandatory limitations/disclaimer content (the dossier's own high-risk-limitation requirement: "Do not claim causality when identification assumptions fail ... adjacent to results") gives chapter 6 real content instead of being a bare control host. |

No two adjacent chapters share an archetype (immersive -> split -> comparative -> flagship-split ->
inspector -> editorial), matching CASCADIA's own "no two adjacent chapters share an archetype" rule,
reused here because it is a sound general rule, not something specific to CASCADIA's content.

## 6. Responsive compositions (deliberate, not reflow)

| Ch | Desktop 1440x900 | Tablet 768x1024 | Mobile 390x844 |
|---|---|---|---|
| 1 | Full-bleed grid, title plate top-center (as built in Stage 2) | Grid re-centered, same single-column title | Grid fills ~70vh, title stacks above |
| 2 | Grid left 60%, intervention-date + treated-zone controls right 40% | Grid top 50vh, controls below | Grid 45vh, controls in a stacked column below (no bottom sheet needed, this project's controls are lighter-weight than CASCADIA's per-chapter worker-heavy ones) |
| 3 | Three-column comparative (one per candidate control zone), shared axis | Two columns, third scrolls | Single column, swipeable or stacked (accordion, real buttons, not swipe-only, matching CASCADIA's own touch-accessibility rule) |
| 4 (flagship) | Two full-height grid halves side by side, diverging | Two halves stacked (top/bottom) with a shared gap readout between them | Two halves stacked, compressed; the gap number stays visible without scrolling between the two halves |
| 5 | Grid + an inspector rail (placebo rank/p-value), right-anchored | Rail stacks below the grid | Rail as a simple stacked block below the grid, no bottom-sheet needed given its light control surface (one button, one result block) |
| 6 | Text-led: methodology/limitations prose left, outcome control + small grid right | Stacked, grid first then prose | Stacked, grid first then prose, prose kept short (the dossier's own disclaimer-adjacency rule means the limitation text must not be buried under a long scroll) |

## 7. Motion rules (reusing Stage 2's already-proven mechanics)

1. **One persistent grid stage** across intro and all 6 chapters (already true; do not remount
   `CityStage` per chapter, pass it different props/overlays instead).
2. **Scrub-bound, not time-based, for anything tied to a scroll distance** (Stage 2's intro already
   does this; it is what makes reverse-scroll and fast-jump deterministic for free, confirmed by
   Stage 2's own independent review). Chapter-internal, non-scroll-triggered motion (e.g. a control's
   own result updating) can be time-based.
3. **No count-up numbers.** A displayed value swaps when a computation completes; it is never
   interpolated from animation progress, matching CASCADIA's own hard rule and this project's own
   `CLAUDE.md` ("Never derive a displayed numeric value from `Date.now()`, `Math.random()`, or
   animation progress").
4. **Reduced motion**: every chapter's scroll-driven transform collapses to an instant final state
   (Stage 2's `useScene.ts` already threads a `reducedMotion` flag through for exactly this).
5. **Every chapter defines entry, exit, and reverse.** Reuse `src/scenes/useScene.ts` (ported from
   CASCADIA) for every chapter's own ScrollTrigger; never call `ScrollTrigger.create` directly.

## 8. Veto-list self-check

| Veto | Result | How avoided |
|---|---|---|
| Generic AI-dashboard layout | 0 hits planned | One continuous city grid reframed per chapter, never a card grid of metrics. |
| Random glassmorphism cards | 0 hits planned | No cards; results render as plain `dl`/text blocks already established in the Lab. |
| Overused purple gradients | 0 hits | Palette is fixed to the dossier's 3 colors, no gradients planned. |
| Unnecessary floating particles / excessive bloom | 0 hits | No particle systems planned; any glow is bounded and tied to a real computed intensity (`resultVisualEncoding.ts`'s existing pattern). |
| Decorative charts with fictional results | 0 hits | Every number shown must trace to `src/engine/estimators.ts`'s real output, per `CLAUDE.md`'s hard rule. |
| Static hero then ordinary dashboard | 0 hits planned | The hero (intro) hands off into a continuous cinematic chapter sequence, not a flat dashboard; Stage 2 already proved the handoff mechanic. |

## 9. Originality ledger

| Component | Status | Notes |
|---|---|---|
| Palette | From dossier | `#F3F0E8`/`#D65343`/`#4B84C5`, specified by the Atlas dossier itself, not copied from either reference site. |
| Typography | Stdlib | System UI sans stack, no third-party font. |
| City grid layout, road geometry | Built from scratch | `src/scenes/cityLayout.ts`, original to this project. |
| Camera/scroll mechanics | Adapted, same-account precedent | `src/scenes/useScene.ts` ported from CASCADIA (`~/cascadia`, same author/account, both part of the Creative Engineering Atlas), not from Everswap/Enpower; no code or assets taken from either reference site per `docs/VISUAL_REFERENCE_RESEARCH.md`'s own explicit constraint. |
| Chapter bar / progress navigation (Stage 3+) | Inspired, not copied | Enpower's bottom chapter-progress bar STRUCTURE (persistent, named sections, completion highlight, percent counter) is reused as a pattern per `VISUAL_REFERENCE_RESEARCH.md`'s own recommendation; no Enpower artwork, copy, or code. |

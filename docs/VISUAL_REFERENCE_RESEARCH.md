# Visual Reference Research

Live inspection of the two references named in the build directive, using real browser automation
(not a static read of marketing copy). Screenshots taken directly; no asset, logo, copy, or source
code reproduced here or planned for reuse.

## Reference A: everswap.com

**What it is doing.** A DeFi landing page. A heavy, deliberately slow percentage loader (diamond glyph,
0 to 100 percent, sparkle/glint animation) gives way to a painterly stylized 3D mountain range rendered
through the diamond as a mask, which then expands to fill the viewport. The brand wordmark ("EverSwap")
crossfades from a thin outline to a solid fill as the visitor scrolls through a long pinned hero section,
with a slow camera dolly/pan happening underneath. The tagline "DeFi at Peak." sits directly above the
mountain's literal peak, a one-line pun tying brand concept to the visual metaphor. A small vertical row
of diamond glyphs on the left edge functions as a section/scroll-progress indicator, reusing the loader's
own glyph rather than inventing a second motif.

**What makes it immersive.**
1. The loading state is not a dead spinner, it is already establishing the diamond motif, the color
   world (deep green), and a sense of weight/anticipation before any content appears.
2. One continuous 3D scene carries the entire hero rather than cutting between static panels; the
   camera move during the pinned scroll is subtle, not a flashy flythrough.
3. Exactly one new idea lands per scroll increment, the mountain reveals, then the wordmark fills, then
   chrome (nav, CTA) fades in, never all at once.

**How this translates to Counterfactual City (original, not copied).** Use the SAME discipline, not the
same assets: one continuous scene for the intro (a street grid, not a mountain), a single reused glyph
across loader/progress-indicator/UI accents (we already have one: the diamond-adjacent split-timeline
mark implied by the dossier's own "urban blocks bifurcate" language, see `docs/ART_DIRECTION.md`), and a
literal visual pun tying concept to geometry (a street plan that visibly forks into two divergent paths
instead of a mountain peak). Never a dark/green DeFi palette, this project's palette is
`#F3F0E8`/`#D65343`/`#4B84C5`, architectural-editorial, and primarily light, the opposite mood.

## Reference B: enpowertrading.co.za (+ case study at dashdigital.studio/case-studies/enpower)

**What it is doing.** A South African energy-trading marketing site. Light, smoky/architectural
background texture (not dark), an oversized bold sans headline with a per-letter brightness gradient,
and body copy that reveals word by word as the visitor scrolls past a pinned headline. A persistent
"Energy usage: Low" live badge sits in the nav itself, real-feeling data embedded in chrome, not just
in a content panel. Scrolling into the body enters a sequence of full-bleed wireframe 3D scenes (solar
panels, then wind turbines and a transmission pylon, each over a warped/perspective ground grid), each
paired with a small, consistently formatted data card: a title ("Solar", "Wind"), two sentences of plain
explanation, a labeled line/area chart with units and a legend (Demand MW vs. a named series), and a
"Hide Info" toggle. A bottom horizontal bar lists every chapter by name (Introduction, Solar, Wind,
Hydro, Transmission, Aggregation, Customer, Future Market) with the completed ones highlighted in the
accent color and a live percent-through counter at the right edge.

**What makes its structural graphics compelling.**
1. Wireframe, not photoreal, geometry for the infrastructure: it reads as a diagram you can trust, not
   a stock-photo mood board. This matches this project's own need to show modeled/simulated
   infrastructure without implying false photographic realism.
2. The data card format is identical across every chapter (title, two-sentence explainer, chart with
   units and a legend, a show/hide toggle), so the visitor learns the reading pattern once and reuses it
   six times, exactly what CTY-INT-001 through 006 need across six chapters.
3. The bottom chapter bar is the single clearest piece of navigation UX in either reference: always
   visible, names every section, shows completion and position, and needs no modal or hamburger menu to
   understand where you are in a 6-to-8-part scrollytelling piece.

**How this translates to Counterfactual City (original, not copied).** Adopt the STRUCTURE of the bottom
chapter bar (persistent, named, highlighted-on-completion, percent counter) as our own primary chapter
navigation, this is a close functional cousin of CASCADIA's own `.fig-index` nav bar, so it also reuses a
pattern this account has already built, tested, and knows the failure modes of (overflow at narrow
widths, overlap with other fixed chrome). Adopt the data-card format (title, plain explainer, labeled
chart with units/legend, toggle) as the shared "evidence panel" component for all 6 interactions, not
just decoration. Do NOT adopt the wireframe-3D-scene-per-chapter approach wholesale, that is an R3F/
Three.js commitment; the dossier's own suggested stack is "React/TS/Vite + domain-specific graph/chart
renderer + GSAP; 3D only where analytically justified." Build the street-grid/map visualization in 2D
SVG or MapLibre first (same discipline CASCADIA used: "2D first, WebGL/R3F only if measurement proves 2D
insufficient"), and only reach for a wireframe 3D treatment for the specific chapters where a flat map
cannot show what needs showing (most likely chapter 4, "counterfactual", where two divergent urban
futures need to read as spatially separate).

## What to avoid from both

- Everswap's percentage loader is read as a deliberate luxury/weight cue there; for an analytical,
  policy-facing tool, a long artificial load delay would undercut credibility rather than build it. Keep
  any loading state honest and short, tied to real asset/fixture load time, not manufactured suspense.
- Enpower's word-by-word paragraph reveal is elegant at marketing-copy length (2 short paragraphs) but
  would become a tedious bottleneck over the longer, more technical explanatory text this project's
  methodology sections need (identification assumptions, limitations). Reserve word-by-word reveal for
  short hero statements only, use a single fade/slide-in for longer technical paragraphs.
- Neither reference needs to justify a numeric claim the way this project does (placebo tests, pretrend
  diagnostics, synthetic-control weights). Neither reference's chart style should be copied past the
  "labeled line/area chart with units and legend" structural level, the actual chart types this project
  needs (comparative trajectories, gap plots, placebo null distributions) are dictated by the dossier's
  own methods section, not by what either reference happened to chart.

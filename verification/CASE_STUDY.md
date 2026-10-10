# Case Study: THE COUNTERFACTUAL CITY

_Draft, prepared for portfolio publication once this project is deployed and authorized for
publishing. Not yet published anywhere._

## What it is

An interactive, scroll-driven explainer for causal-inference methodology, built around a single
question: "if this city zone hadn't received a policy intervention, what would have happened to it
instead?" A 24-zone synthetic city grid carries the visitor through an intro and 6 chapters, each
introducing one real analytical control: choosing what's treated and when, choosing a comparison
group, fitting a synthetic-control counterfactual, running a placebo diagnostic, and reading the
honest limitations of the whole exercise.

## The problem it solves

Causal-inference methods (difference-in-differences, synthetic control) are usually presented as
static charts in a paper or a slide deck, legible to someone who already knows the method. This
project asks: can the METHOD ITSELF be the interface? Every control a visitor touches triggers a
real recomputation against real (synthetic, declared) panel data, not a canned animation, so the
visitor is manipulating the actual estimator, watching its actual assumptions, not watching a
video of someone else having done so.

## Technical highlights

- **A TypeScript port of a Python reference estimator**, independently tested for numerical parity
  (within 3 units on the synthetic-control ATT, 1e-6 on DiD), so the in-browser computation is
  provably not a simplified stand-in for the "real" analysis, it IS the real analysis, running
  client-side.
- **A flagship chart built from data the estimator already produced but never rendered**: the
  synthetic-control estimator's own per-day gap series existed from the first build pass; the
  observed-vs-synthetic trajectory chart that makes it visible (the project's own literal
  "two timelines diverge" moment) was added only after a review caught that the chart didn't exist
  yet, the scroll-driven stage separation alone didn't actually show WHAT was diverging.
- **A persistent one-visual-language, many-mount-points stage architecture**: every chapter gets its
  own city-grid SVG instance rather than one shared DOM node migrated between chapters, a deliberate
  choice to avoid retrofitting a shared-node architecture onto chapters whose own sticky-section
  layout was already independently verified.
- **Chapter-level visual distinctiveness built, checked, and rebuilt**: two chapters were reworked
  after independent review correctly judged a first attempt (mirroring a layout and changing its
  accent color) as "a different color on the same shape," not a genuinely distinct composition.

## What was hardest

Getting motion to be both REAL (a true function of scroll position, reversible, deterministic) and
CORRECT under conditions that are easy to miss in a quick build: a GSAP `pin: true` configuration
that silently trapped scroll with zero added height, a `ScrollTrigger` measurement race against an
async data fetch that could permanently freeze an animation at its end state, a flex-layout
min-height interaction that collapsed a chart to 1 pixel tall specifically on mobile. None of these
were caught by a passing test suite alone; all were caught by actually opening the generated
screenshots and looking, the project's own mandatory visual-QA discipline.

## Honest limitations

See `LIMITATIONS.md` for the full, current list. The two largest: the chapter-level visual-design
pass is real but not exhaustive (texture, asymmetric block treatment beyond what chapters 3-5 now
have), and performance has one real measurement (chapter 4, desktop), not a full per-chapter budget.
The underlying data is fully synthetic by design, declared everywhere it's shown, not a limitation
to hide but the dossier's own explicit, honest fallback when a verified real comparable dataset
wasn't available.

# 02 / COUNTERFACTUAL CITY

*Source: Creative Engineering Atlas, dossier 02 (Build Book, p.10) + executable contract (Execution Edition, p.90). Namespace `CTY`.*

**Discipline:** Causal inference • Urban policy / mobility

**Problem and objective.** Examine whether an apparent policy effect survives counterfactual and confounding analysis.

**Intended audience.** Policy analysts, causal scientists, urban planners

**Signature flagship interaction.** Two urban timelines diverge as estimator assumptions are manipulated.

**Release scope.** 6 functional controls + 6 narrative chapters + 1 original flagship experience + complete
methodology + static deploy

## Creative direction

**Visual identity.** #F3F0E8 / #D65343 / #4B84C5. Architectural editorial; map grids and neutral typography. Use an
asymmetric editorial grid, carefully controlled negative space and an original spatial metaphor rather than a generic
dashboard. A title/technical legend must remain legible during animation.

**Opening storyboard (0-12s):**
1. 0-3 street plan unfolds
2. 3-6 traffic pulses
3. 6-9 temporal split opens
4. 9-12 alternate outcome planes lock into lab

Handoff: the final hero visual must persist or morph into the functional interactive scene. Skip intro is keyboard-operable; reduced-motion loads the final state directly.

## Six analytical chapters

**Dossier chapter names (Build Book, p.10):**

1. **Observed world**
2. **treatment**
3. **matched controls**
4. **counterfactual**
5. **diagnostics**
6. **limitations**

**Execution contract's visual/motion continuity note (p.90), including its own chapter list where it may use different names for the same 6 scenes:**

Urban blocks bifurcate into alternate histories; split scroll timelines. Opening: 0–3 s establishes the
phenomenon; 3–6 s introduces the data/physics; 6–9 s reveals one consequential change; 9–12 s transitions to
the functional laboratory. Six chapters: context, system, method, intervention, diagnostics, comparison. Each
chapter needs entry/exit/reverse and reduced-motion treatment. These times are initial storyboard targets, not
empirical performance claims.

## Six required interactions (P0)

**Authoritative IDs and behaviors (execution contract, p.90):**

| ID | Behavior |
|---|---|
| CTY-INT-001 | Change intervention date. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |
| CTY-INT-002 | select treated zone. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |
| CTY-INT-003 | pick control pool. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |
| CTY-INT-004 | adjust weights. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |
| CTY-INT-005 | run placebo. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |
| CTY-INT-006 | change outcome. Input must update validated state, calculate a real outcome or select a traceable fixture, visibly explain the changed quantity, handle invalid inputs, and restore baseline on reset. |

**Dossier's own flavor text for the same 6 controls (Build Book, p.10), kept separately because the dossier and contract orderings are not reliably alignable 1:1 by wording alone -- match by reading both, not by position:**

1. Change intervention date > rebuild post-period > treatment graph
2. select treatment area > update group > map
3. choose control pool > re-estimate > comparative trajectories
4. set weights > synthetic reconstruction > gap
5. launch placebo > null distribution > evidence bands
6. change outcome > reload compatible series > effect estimate

Every control needs undo/Reset Scenario, disabled/infeasible feedback, and deterministic comparison state.

## Data, methods and provenance

**Source and data strategy (dossier).** NYC TLC Parquet taxi activity, compatible geography/time external controls if verified;
otherwise explicit simulated policy series; publish schema/period/coverage

**Data strategy (execution contract).** NYC TLC or fully synthetic panel with declared treatment

**Methods and implementation.** Difference in differences, synthetic control, event studies, placebo and pretrend
diagnostics; identification conditions explicit

**Analytical engine (execution contract).** Difference-in-differences / synthetic control; placebo inference

Export raw-source references, cleaned records, derived features, model/solver outputs, parameter metadata, validation metrics and a provenance manifest. Version random seeds, assumptions, transformation code and fixture checksums. Distinguish historical measurements, fitted estimates, counterfactual inference and hypothetical simulation in all labels.

## Stack and responsiveness

**Recommended tools.** React, TS, MapLibre, D3, GSAP; Python pandas/statsmodels offline

**Suggested candidate stack (execution contract).** React/TS/Vite + domain-specific
graph/chart renderer + GSAP; 3D only where analytically justified.

Desktop: canvas-led composition with anchored inspector. Tablet: reduced scene depth, stacked inspector. Mobile: touch-first bottom-sheet controls, large targets, 2D fallback, no hover-only functionality. Reduced motion: instant state changes, no parallax/spinning intro.

## Validation and risk

**Project-specific verification.** Placebo zero-effects; treated dates; leakage; pretrends; bootstrap and missing control
errors

**Numerical and negative-case tests (execution contract).** Pretrend; treatment leakage; estimator reference; placebo distribution. Every control must have deterministic
seed or fixture version, units, test vector, expected output, and acceptable numerical tolerance. Add
zero/empty data, invalid parameter, missing fixture, interrupted computation, and unavailable GPU cases.

**Explicit high-risk limitation.** Do not claim causality when identification assumptions fail. Apply scientific disclaimer adjacent to results rather
than burying it in the footer.

**Risks and boundaries (dossier).** Associations are not causal proof unless assumptions hold; spatial data correlations and
exposure rules matter. Mitigations: explicit assumptions, honest labels, bounded models, progressive enhancement, independently tested reference computations, and documented unsupported states.

**Complexity estimates (1-10).** analytics 10, frontend 8, motion/3D 9, data preparation 8, overall 9

**Rough effort.** about
106–232 focused person-hours. Planning estimate, not a guarantee.

**Portfolio roles and proof.** Causal statistics, experimental design, geospatial modeling.

## Acceptance gates and mandatory evidence

| Gate ID | Minimum evidence |
|---|---|
| CTY-DATA-001 | Source/license review; schema; fixture checksum; reference calculator test. |
| CTY-MATH-001 | Independent numerical baseline, boundary and infeasible-case agreement. |
| CTY-UX-001 | Six working controls + keyboard/touch/reset, recorded e2e tests. |
| CTY-MOTION-001 | Intro and all six chapter captures, reverse-scroll and reduced-motion tests. |
| CTY-RELEASE-001 | Production build, Pages base path, deployed smoke test, honest limitations. |

**Agent split.** Data/AI owns algorithm/fixtures; Creative Director owns art board; Frontend owns state/controls; Motion/3D owns
choreography; QA independently verifies; Orchestrator integrates.

## Eight-phase build roadmap

1. Audit data and licenses; write falsifiable analytical assertions
2. Art-direct moodboard, design tokens, narrative frames
3. Build barebones flagship interaction with ~30 records/nodes
4. Generate offline reference metrics and versioned fixture pipeline
5. Implement six real controls and all navigable scenes
6. Stage cinematic opening and intentional scroll/hover transitions
7. Run correctness, accessibility, regression and mobile QA
8. Export static build, technical case study, demo assets and metadata

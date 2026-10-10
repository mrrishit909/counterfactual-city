# THE COUNTERFACTUAL CITY

Urban policy causal-inference project, #2 in the Creative Engineering Atlas. Built from
`~/creative-engineering`'s infrastructure (agents, skills, requirements extraction), following the
same workflow and discipline verified on CASCADIA (`~/cascadia`, project #1).

## Before touching this repo

Read, in order:
1. `docs/PROJECT_SPEC.md` (the Atlas dossier for this project, verbatim)
2. `docs/planning/IMPLEMENTATION_PLAN.md` (architecture, resolved decisions, once written)
3. `specifications/REQUIREMENTS.yaml` (this repo's own 11 requirement rows: 6 interactions + 5 gates)
4. `execution/PROGRESS.md` (current state, resume point)

## Precedence (from the Atlas, p.78)

verified user brief and approved reference images > approved project-specific contract >
`~/creative-engineering/docs/extracted/EXECUTION_PROTOCOL.md` > this project's dossier
(`~/creative-engineering/docs/projects/PROJECT_02.md`) > optional creative inspirations.

## Resolved architecture decisions (append here as they're made; do not re-litigate)

- Analytical engine: difference-in-differences + synthetic control + placebo/pretrend diagnostics
  (per the dossier; NOT a single DiD estimator alone, both methods are required release scope).
- Data: NYC TLC trip-record Parquet data if a verified compatible geography/time external control
  series exists; otherwise an explicit, clearly labeled synthetic panel with a declared treatment.
  Never silently substitute one for the other.
- Python reference implementation (pandas/statsmodels, offline) is the source of truth; any
  browser-side computation is checked against it, not the other way around.
- Visual identity: `#F3F0E8` / `#D65343` / `#4B84C5`, architectural editorial, map grids, asymmetric
  grid, original spatial metaphor. Inspired by (never copying) everswap.com and enpowertrading.co.za's
  craftsmanship, per `docs/VISUAL_REFERENCE_RESEARCH.md`.
- This project is held to BOTH the Atlas's 5-gate system AND the parent 10-site portfolio
  directive's doc-file list and 11-category release gate, same as CASCADIA.

## Hard rules

- Every one of the 6 required controls must trigger a real computation (Worker/Python-matched
  fixture or browser-side re-estimation), never a cosmetic state change.
- Never label a simulated or counterfactual difference as a causal effect without stating the
  identification assumptions it depends on, adjacent to the result, not buried in a footer.
- Never claim a gate (CTY-DATA-001 through CTY-RELEASE-001) passed without the evidence that
  gate's row in `REQUIREMENTS.yaml` requires.
- Distinguish historical measurement, fitted estimate, counterfactual inference, and hypothetical
  simulation in every label that presents a number.

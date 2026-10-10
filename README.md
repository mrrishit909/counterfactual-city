# THE COUNTERFACTUAL CITY

An urban-policy causal-inference visualization. A 24-zone city grid, rendered as one persistent SVG
stage, is scrolled through an intro and six chapters, with six interactive controls (intervention
date, treated zone, control pool, synthetic-control donor weights, placebo test, outcome variable)
that each trigger a real recomputation against a declared-synthetic data panel.

Project #2 of the Creative Engineering Atlas. See `CLAUDE.md` for the full project contract and
precedence order, and `execution/PROGRESS.md` for the complete, chronological build history.

## What's real, what's simulated

Every one of the 6 controls triggers a real computation: difference-in-differences and
synthetic-control estimators (`src/engine/estimators.ts`, a TypeScript port of the Python oracle in
`analysis/models/estimators.py`, parity-tested to within 3 units), a permutation placebo test, and a
pretrend diagnostic. Nothing displayed is interpolated from scroll/animation progress or randomly
generated at render time. The underlying panel data is a fully synthetic, seeded, declared-treatment
dataset (`analysis/data/synthetic_panel.py`), not real-world data; see `DATA_SOURCES.md` and
`specifications/DATA_CONTRACT.yaml` for why, and `LIMITATIONS.md` for every other honestly-documented
simplification.

## Quickstart

```bash
npm install
npm run dev       # dev server
npm run build      # production build (tsc -b && vite build)
npm run preview     # serve the production build locally
```

Python oracle / analytical tests (uses a local `.venv`; the generator and reference estimator live
in `analysis/`):

```bash
.venv/bin/python -m pytest analysis/validation/ -q
```

## Test suites

```bash
npx vitest run       # unit + component + analytical-parity tests
npx playwright test    # e2e, against the production preview build, no mocks
npx tsc -b         # typecheck
npx oxlint         # lint
```

See `TESTING.md` for what each suite actually covers and how the evidence in `verification/` is
captured and reproduced.

## Documentation map

- `CLAUDE.md`, project rules, resolved architecture decisions, hard constraints.
- `ARCHITECTURE.md`, system design: the persistent stage, shared GSAP lifecycle, scenario-state
  ownership, the chapter navigation layer.
- `VISUAL_DESIGN.md`, the design system (palette, type, motion tokens) and how it's applied per
  chapter.
- `MOTION_SYSTEM.md`, the intro and per-chapter choreography, as actually built.
- `DATA_SOURCES.md`, where the panel data and every computed result come from.
- `TESTING.md`, test suite breakdown and how to reproduce the evidence in `verification/`.
- `LIMITATIONS.md`, every known, deliberate simplification, honestly stated.
- `DEPLOYMENT.md`, build and static-hosting instructions.
- `execution/PROGRESS.md`, the full, chronological build log (every bug found, every fix, every
  milestone commit).
- `verification/`, real evidence: screenshots, frame-pacing measurements, independent review
  reports.
- `docs/ART_DIRECTION.md`, the full creative/motion specification this build follows.

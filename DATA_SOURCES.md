# Data Sources

## The panel: fully synthetic, declared treatment

The dossier (`docs/PROJECT_SPEC.md`) explicitly permits a fallback: "NYC TLC Parquet taxi activity +
verified compatible geography/time external controls if verified; otherwise an explicit simulated
policy series." Verifying a real, license-clean, compatible external control series was not completed;
rather than silently substitute one data strategy for the other, the dossier's own honest fallback is
used, and every number derived from it is labeled as a synthetic-panel result everywhere it appears
(see `VISUAL_DESIGN.md`'s own "result labeling" section). The full decision, and what a future
migration to real data would require, is recorded in `specifications/DATA_CONTRACT.yaml` (do not
duplicate that record here; it is the source of truth).

- **Generator**: `analysis/data/synthetic_panel.py`, seeded (`seed: 20261010` in
  `specifications/DATA_CONTRACT.yaml`), producing a long-format zone-by-day panel (24 zones, 180
  days) with a single declared treated zone and intervention day.
- **Manifest**: `analysis/data/manifest.json`, written by the generator, includes a SHA-256 checksum
  of the generated panel so the fixture used by the browser build is traceable to the exact generator
  run that produced it.
- **Schema**: `specifications/DATA_CONTRACT.yaml`'s own `schema.panel` section is authoritative
  (columns, types, units).
- **Browser fixture**: `analysis/preprocessing/export_browser_fixture.py` exports the panel to the
  JSON fixture the React app actually fetches at runtime (`src/engine/__fixtures__/panel.json` for
  tests; the production build fetches the equivalent public asset).

## The estimators: TypeScript port, checked against a Python oracle

`analysis/models/estimators.py` is the independent Python reference implementation (DiD,
synthetic-control via NNLS, placebo permutation test, pretrend diagnostic), tested directly in
`analysis/validation/test_estimators.py` (25 tests: 9 golden cases plus boundary cases, run with
`.venv/bin/python -m pytest analysis/validation/ -q`).

`src/engine/estimators.ts` is the TypeScript port that actually runs in the browser. It is NOT a
line-for-line translation: the Python side uses `scipy.optimize.nnls`; the TypeScript side uses a
hand-written projected-gradient-descent NNLS solver (`nnlsProjectedGradient`), since there is no
browser-native NNLS equivalent to scipy's. Both solve the same convex non-negative-least-squares
problem via different, independently-convergent algorithms, so parity is checked at the level of the
RECOVERED ESTIMATE (the synthetic-control ATT, within 3 units; DiD within 1e-6), not bit-identical
donor weights. The parity test suite lives in `src/engine/estimators.test.ts` (Vitest) and reads the
same golden fixtures the Python oracle's own tests use.

## What is a real computed output vs. a visual encoding

Every number shown in the UI (the DiD ATT, the synthetic-control gap, the placebo rank/p-value, the
pretrend slope p-value) is the direct, unmodified output of one of the estimators above, run against
the real (synthetic) panel data with the visitor's own current scenario state. The only DERIVED
visual mapping is `src/scenes/resultVisualEncoding.ts`'s `encodeResult()`, which maps a real
`attPostMean` or DiD `att` value to a color (red if negative, blue if positive) and a 0-1 pulse
intensity, using a per-outcome calibration scale (`defaultScaleForOutcome`) so the three outcome
series' genuinely different units and magnitudes (`trip_volume` ~hundreds, `avg_speed_kmh` ~single
digits, `transit_ridership` ~hundreds) don't produce a pulse that's invisible for one outcome and
clipped for another. This encoding never substitutes for the exact numeric readout shown alongside it.

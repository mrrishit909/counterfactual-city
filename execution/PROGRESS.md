# THE COUNTERFACTUAL CITY, Progress

## Current milestone

M2 (analytical specification) done. M0/M1 (environment audit, creative research) done. M3 onward
(architecture foundation, visual vertical slice, cinematic experience, interactive laboratory,
integration, polish, independent review, final acceptance, publication) NOT started.

This is an honest in-progress state, not a completion claim. The Atlas's own complexity estimate for
this project is 9/10 overall with a rough effort of 106-232 focused person-hours (docs/PROJECT_SPEC.md);
this session has done real, tested, committed work on the two gates that don't depend on any frontend
or motion work, and stopped there rather than rush the remaining ~85-90% of scope.

## Latest verified commit

Run `git log --oneline -5` in `~/counterfactual-city` for the exact hash; this file is updated in the
same commit as the work it describes, so the latest commit IS the latest verified state.

## Completed requirements (specifications/REQUIREMENTS.yaml)

- `CTY-DATA-001`: **implemented**. Data strategy decided and documented (fully synthetic panel,
  declared treatment; a real NYC TLC + external-control series was evaluated and explicitly deferred,
  not silently swapped in or hidden). Schema, fixture checksum, and a reference calculator test
  pipeline are in place.
- `CTY-MATH-001`: **implemented**. 25/25 pytest passing: ground-truth ATT recovery for both DiD and
  synthetic control, an independent two-method cross-check, placebo and pretrend diagnostics, and 11
  boundary/infeasible-input cases. See `analysis/validation/test_estimators.py`.

Neither gate is yet `independently verified`, that requires a separate reviewer pass per this
project's own (CASCADIA-derived) discipline, scheduled for M9, not before the frontend/motion work
exists to review alongside it.

## Unfinished requirements

- `CTY-INT-001` through `CTY-INT-006`: all `unstarted`. The Python reference implementation each
  control needs (`analysis/models/estimators.py`) now exists; what's missing is the React/TS frontend
  state layer, the six controls themselves, and the Worker/fixture bridge connecting UI actions to
  real recomputation (either via a browser-side port of the estimators or via versioned precomputed
  fixtures for the scenario grid, a decision not yet made, see Decision Log below).
- `CTY-UX-001`, `CTY-MOTION-001`, `CTY-RELEASE-001`: all `unstarted`, depend on the frontend/motion
  work above.

## Passing tests

- `analysis/validation/test_estimators.py`: 25/25 (`source .venv/bin/activate && python3 -m pytest
  analysis/validation/ -v`).
- Frontend template's own smoke test (`e2e/smoke.spec.ts`) is still the UNMODIFIED scaffold from
  `templates/frontend` (count-is-0 button), not yet replaced with this project's own content. Not run
  this session since there is no project-specific frontend yet to test.

## Failing tests

None currently (nothing beyond the template scaffold has been built to fail).

## Open P0/P1 issues

None yet opened; too early in the build for defect tracking to be meaningful. `execution/KNOWN_ISSUES.md`
will be created once there is a UI to find issues in.

## Performance status

Not applicable yet, no frontend build exists.

## Active workstreams

None currently running; this session's work ended at a clean commit boundary.

## Next critical-path task

**M3: architecture foundation.** In order:
1. Decide the browser-side computation strategy for the 6 controls: a JS/TS port of
   `analysis/models/estimators.py` (consistent with CASCADIA's own WASM-solver precedent, but DiD/
   synthetic-control in JS is a smaller lift than a full LP solver) vs. a precomputed versioned
   fixture grid (faster to build, less "real" per control). Recommendation: port the estimator math
   to TypeScript directly (it's linear algebra + a small NNLS solve, no WASM needed), cross-checked
   against this Python reference the same way CASCADIA's TS solver was cross-checked against its
   Python oracle.
2. Set up the React/TS state architecture: a single authoritative scenario-state store (intervention
   date, treated zone, control pool, donor weights, outcome variable) separate from presentation state
   (camera, scroll, scene), per Part 10 of the build directive, this is the exact CASCADIA lesson
   ("shared frontend state requires clear ownership", "animation state must remain separate from
   analytical state") this project is required to retain.
3. Wire ONE control (recommend CTY-INT-001, change intervention date, the simplest) end to end against
   the real TS port, with a real e2e test, before building the other five or any chapter choreography,
   per Part 21's M4 guidance ("Build one complete sequence... Independently verify the slice. Do not
   build the entire cinematic experience on an unverified architecture").
4. Only then: design system (`docs/ART_DIRECTION.md`, `docs/DESIGN_SYSTEM.md`,
   `docs/MOTION_SPECIFICATION.md`, `docs/RESPONSIVE_COMPOSITIONS.md`), informed by
   `docs/VISUAL_REFERENCE_RESEARCH.md` (already written) and the dossier's palette/metaphor.

## Decision log (append here, do not re-litigate once recorded)

- **Data source: fully synthetic, not NYC TLC.** See `specifications/DATA_CONTRACT.yaml` for the full
  reasoning. Revisit only if a verified compatible real data source becomes available; the estimator
  code is already data-source-agnostic.
- **Donor-weight solver: NNLS relaxation, not SLSQP.** SLSQP reproducibly failed to converge on this
  panel's near-collinear donor matrix (a real failure, confirmed by re-running, not assumed). NNLS
  with an augmented sum-to-one row is the standard lightweight relaxation and is used instead. If a
  stricter exact-QP solver is ever needed, `cvxpy` or `quadprog` are the natural upgrades, not
  revisiting SLSQP.

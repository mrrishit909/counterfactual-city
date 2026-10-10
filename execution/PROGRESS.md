# THE COUNTERFACTUAL CITY, Progress

## Current milestone

M0 (environment audit), M1 (creative research), M2 (analytical specification) done. M3 (architecture
foundation) IN PROGRESS: the scenario-state architecture exists and one control (CTY-INT-001, change
intervention date) is wired end to end against a real TypeScript port of the Python estimator, with
parity tests, unit tests, and a real-browser Playwright e2e test, all green, on the production build.
M4 onward (the other 5 controls, 6 chapters, cinematic intro, art direction/motion, 3D where
justified, responsive compositions, accessibility, performance, independent review, final acceptance,
publication) NOT started.

This is an honest in-progress state, not a completion claim. The Atlas's own complexity estimate for
this project is 9/10 overall with a rough effort of 106-232 focused person-hours (docs/PROJECT_SPEC.md);
this session has done real, tested, committed work through the start of M3, and stopped at a clean,
fully-green checkpoint rather than rush the remaining majority of scope.

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

None of the 3 implemented gates is yet `independently verified`, that requires a separate reviewer
pass per this project's own (CASCADIA-derived) discipline, scheduled for M9, not before the rest of
the frontend/motion work exists to review alongside it.

## Unfinished requirements

- `CTY-INT-001`: **implemented** (see above). Reset/keyboard/invalid-input/visible-explanation all
  covered; not yet styled.
- `CTY-INT-002` through `CTY-INT-006`: all `unstarted`. The pattern CTY-INT-001 establishes (a TS
  port of the matching Python estimator function, parity-tested, wired into `ScenarioState` via
  `ScenarioContext.tsx`, one new control component in `App.tsx` or its eventual chapter) is the
  template to repeat for each. `synthetic_control`, `run_placebo_test`, and `pretrend_diagnostic`
  still need their own TS ports (only `diff_in_diff` is ported so far); the NNLS donor-weight solve
  in particular needs either a small TS NNLS implementation or a decision to keep that one
  computation server-precomputed as a versioned fixture grid instead of live in-browser, not yet
  decided.
- `CTY-UX-001`, `CTY-MOTION-001`, `CTY-RELEASE-001`: all `unstarted`, depend on the remaining
  controls, the 6 chapters, and the art-direction/motion work.

## Passing tests

- `analysis/validation/test_estimators.py`: 25/25 (`source .venv/bin/activate && python3 -m pytest
  analysis/validation/ -v`).
- `src/**/*.test.{ts,tsx}` (Vitest): 15/15 (`npx vitest run`), including 9 TS/Python DiD parity cases
  agreeing to 1e-6 and 4 boundary cases, plus a real component test of the wired control.
- `e2e/smoke.spec.ts` (Playwright, against the production build): 5/5 (`npx vite build && npx
  playwright test`), including a real-keyboard CTY-INT-001 test and 3 responsive-viewport screenshots
  (desktop/tablet/mobile, `verification/SCREENSHOTS/`, visually opened and confirmed non-blank).
- `npx tsc -b`: clean. `npx oxlint`: clean (one non-blocking fast-refresh-only warning in
  `ScenarioContext.tsx` from combining a Provider and a hook in one file, a deliberate, common
  pattern, not a defect).

## Failing tests

None.

## Open P0/P1 issues

None yet opened; too early in the build for defect tracking to be meaningful. `execution/KNOWN_ISSUES.md`
will be created once there is a UI to find issues in.

## Performance status

Not applicable yet, no frontend build exists.

## Active workstreams

None currently running; this session's work ended at a clean commit boundary.

## Next critical-path task

**M3/M4, continuing.** Steps 1-3 of the original M3 plan are DONE (decision made: TS port, not a
fixture grid; scenario-state architecture built in `ScenarioContext.tsx`; CTY-INT-001 wired end to
end with parity/unit/e2e tests, all green). Next, in order:
1. Port `synthetic_control` (with the NNLS donor-weight solve), `run_placebo_test`, and
   `pretrend_diagnostic` from `analysis/models/estimators.py` to `src/engine/estimators.ts`, each
   parity-tested against fresh golden cases from the Python oracle, the same pattern `diffInDiff`
   already establishes. A TS NNLS is a small, well-known algorithm (no new dependency needed); if it
   proves awkward, the documented fallback is a precomputed fixture grid for just the weight-fit step.
2. Wire the remaining 5 controls (CTY-INT-002 through 006) against those ports, each with its own
   parity + unit + e2e test, before any chapter choreography or art direction, per Part 21's M4
   guidance ("Independently verify the slice. Do not build the entire cinematic experience on an
   unverified architecture").
3. Only then: design system (`docs/ART_DIRECTION.md`, `docs/DESIGN_SYSTEM.md`,
   `docs/MOTION_SPECIFICATION.md`, `docs/RESPONSIVE_COMPOSITIONS.md`), informed by
   `docs/VISUAL_REFERENCE_RESEARCH.md` (already written) and the dossier's palette/metaphor (already
   partially applied to `src/App.css`'s color tokens, not yet to layout/typography/motion).
4. The 6 chapters, the cinematic intro, and the flagship interaction (two urban timelines diverging)
   come after all 6 controls are real, not before, so motion work has real data to choreograph rather
   than placeholder numbers.

## Decision log (append here, do not re-litigate once recorded)

- **Data source: fully synthetic, not NYC TLC.** See `specifications/DATA_CONTRACT.yaml` for the full
  reasoning. Revisit only if a verified compatible real data source becomes available; the estimator
  code is already data-source-agnostic.
- **Donor-weight solver: NNLS relaxation, not SLSQP.** SLSQP reproducibly failed to converge on this
  panel's near-collinear donor matrix (a real failure, confirmed by re-running, not assumed). NNLS
  with an augmented sum-to-one row is the standard lightweight relaxation and is used instead. If a
  stricter exact-QP solver is ever needed, `cvxpy` or `quadprog` are the natural upgrades, not
  revisiting SLSQP.

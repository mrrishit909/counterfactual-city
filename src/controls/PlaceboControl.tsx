import { useScenario } from "../engine/ScenarioContext";

// CTY-INT-005. Split out of App.tsx into its own module (same reasoning as the other
// controls/*.tsx modules) so chapter 5 (src/scenes/Chapter5Diagnostics.tsx) can import it without a
// circular dependency on App.tsx.

export function PlaceboControl() {
  const { placebo, runPlacebo } = useScenario();
  return (
    <fieldset>
      <legend>5. Placebo test</legend>
      <p className="hint">
        Re-runs the synthetic control treating every non-treated zone as if it were treated, to see
        where the real effect ranks in that null distribution.
      </p>
      <button type="button" onClick={runPlacebo} data-testid="run-placebo">
        Run placebo test
      </button>
      {placebo.status === "running" && <p data-state="loading">Running placebo test{"…"}</p>}
      {placebo.status === "error" && (
        <p className="error" role="alert" data-testid="placebo-error">
          {placebo.message}
        </p>
      )}
      {placebo.status === "done" && (
        <dl className="result" data-testid="placebo-result">
          <dt>Real effect rank among {placebo.result.nPlacebos + 1} units (by |effect|)</dt>
          <dd data-testid="placebo-rank">
            {placebo.result.rank} of {placebo.result.nPlacebos + 1}
          </dd>
          <dt>Permutation p-value</dt>
          <dd>{placebo.result.pValue.toFixed(3)}</dd>
        </dl>
      )}
    </fieldset>
  );
}

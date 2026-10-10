import { ScenarioProvider, useScenario } from "./engine/ScenarioContext";
import "./App.css";

function InterventionDateControl() {
  const { load, scenario, result, error, setInterventionDay, reset } = useScenario();

  if (load.status === "loading") {
    return (
      <div className="panel" data-state="loading">
        Loading panel data…
      </div>
    );
  }
  if (load.status === "error") {
    return (
      <div className="panel" data-state="error">
        Failed to load the scenario data: {load.message}
      </div>
    );
  }

  const { meta } = load.panel;
  const dayMin = 1;
  const dayMax = meta.n_days - 1;

  return (
    <div className="panel" data-state="ready">
      <h1>The Counterfactual City</h1>
      <p className="disclaimer">
        Difference-in-differences estimate, treated zone {meta.treated_zone}.
        Fully synthetic panel with a declared treatment (not real-world data); see{" "}
        <code>specifications/DATA_CONTRACT.yaml</code>.
      </p>

      <label htmlFor="intervention-day">
        Intervention day ({dayMin}{"–"}{dayMax})
      </label>
      <input
        id="intervention-day"
        type="range"
        min={dayMin}
        max={dayMax}
        value={scenario.interventionDay}
        onChange={(e) => setInterventionDay(Number(e.target.value))}
        aria-describedby="intervention-day-value"
      />
      <output id="intervention-day-value" htmlFor="intervention-day">
        day {scenario.interventionDay}
      </output>

      <button type="button" onClick={reset} aria-label="Reset scenario to baseline">
        Reset Scenario
      </button>

      {error && (
        <p className="error" role="alert" data-testid="estimator-error">
          {error}
        </p>
      )}

      {result && (
        <dl className="result" data-testid="did-result">
          <dt>Estimated effect (ATT)</dt>
          <dd data-testid="att-value">{result.att.toFixed(1)}</dd>
          <dt>Treated zone, pre to post</dt>
          <dd>
            {result.preTreatedMean.toFixed(1)} {"→"} {result.postTreatedMean.toFixed(1)}
          </dd>
          <dt>Control zones, pre to post</dt>
          <dd>
            {result.preControlMean.toFixed(1)} {"→"} {result.postControlMean.toFixed(1)}
          </dd>
        </dl>
      )}
    </div>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <InterventionDateControl />
    </ScenarioProvider>
  );
}

export default App;

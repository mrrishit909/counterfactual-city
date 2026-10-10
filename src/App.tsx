import { ScenarioProvider, useScenario } from "./engine/ScenarioContext";
import { Chapter2Treatment } from "./scenes/Chapter2Treatment";
import { Chapter3MatchedControls } from "./scenes/Chapter3MatchedControls";
import { Chapter4Counterfactual } from "./scenes/Chapter4Counterfactual";
import { Chapter5Diagnostics } from "./scenes/Chapter5Diagnostics";
import { IntroSequence } from "./scenes/IntroSequence";
import type { Outcome } from "./engine/types";
import "./App.css";
import "./scenes/scenes.css";

const OUTCOME_LABELS: Record<Outcome, string> = {
  trip_volume: "Trip volume (trips/day)",
  avg_speed_kmh: "Average speed (km/h)",
  transit_ridership: "Transit ridership (riders/day)",
};

function OutcomeControl() {
  const { load, scenario, setOutcome } = useScenario();
  if (load.status !== "ready") return null;
  return (
    <fieldset>
      <legend>6. Outcome variable</legend>
      <label htmlFor="outcome-select">Outcome series</label>
      <select
        id="outcome-select"
        value={scenario.outcome}
        onChange={(e) => setOutcome(e.target.value as Outcome)}
      >
        {load.panel.meta.outcomes.map((o) => (
          <option key={o} value={o}>
            {OUTCOME_LABELS[o]}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

export function Lab() {
  const { load, did, didError, reset } = useScenario();

  if (load.status === "loading") {
    return (
      <main className="panel" data-state="loading">
        Loading panel data{"…"}
      </main>
    );
  }
  if (load.status === "error") {
    return (
      <main className="panel" data-state="error">
        Failed to load the scenario data: {load.message}
      </main>
    );
  }

  return (
    <main className="panel" data-state="ready">
      <h1>The Counterfactual City</h1>
      <p className="disclaimer">
        Difference-in-differences and synthetic-control estimates against a fully synthetic panel
        with a declared treatment (not real-world data); see{" "}
        <code>specifications/DATA_CONTRACT.yaml</code>. All six controls on this page (five above,
        in chapters 2-5's own sections, one below) trigger a real recomputation, never a cosmetic
        change.
      </p>

      <OutcomeControl />

      <button type="button" onClick={reset} aria-label="Reset scenario to baseline" className="reset-button">
        Reset Scenario
      </button>

      {didError && (
        <p className="error" role="alert" data-testid="estimator-error">
          {didError}
        </p>
      )}

      {did && (
        <dl className="result" data-testid="did-result">
          <dt>Difference-in-differences estimate (ATT)</dt>
          <dd data-testid="att-value">{did.att.toFixed(1)}</dd>
          <dt>Treated zone, pre to post</dt>
          <dd>
            {did.preTreatedMean.toFixed(1)} {"→"} {did.postTreatedMean.toFixed(1)}
          </dd>
          <dt>Control zones, pre to post</dt>
          <dd>
            {did.preControlMean.toFixed(1)} {"→"} {did.postControlMean.toFixed(1)}
          </dd>
        </dl>
      )}
    </main>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <IntroSequence>
        <Chapter2Treatment />
        <Chapter3MatchedControls />
        <Chapter4Counterfactual />
        <Chapter5Diagnostics />
        <Lab />
      </IntroSequence>
    </ScenarioProvider>
  );
}

export default App;

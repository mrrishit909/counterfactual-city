import { ScenarioProvider, useScenario } from "./engine/ScenarioContext";
import type { Outcome } from "./engine/types";
import "./App.css";

const OUTCOME_LABELS: Record<Outcome, string> = {
  trip_volume: "Trip volume (trips/day)",
  avg_speed_kmh: "Average speed (km/h)",
  transit_ridership: "Transit ridership (riders/day)",
};

function InterventionDateControl() {
  const { load, scenario, setInterventionDay } = useScenario();
  if (load.status !== "ready") return null;
  const { meta } = load.panel;
  return (
    <fieldset>
      <legend>1. Intervention date</legend>
      <label htmlFor="intervention-day">
        Intervention day (1{"–"}{meta.n_days - 1})
      </label>
      <input
        id="intervention-day"
        type="range"
        min={1}
        max={meta.n_days - 1}
        value={scenario.interventionDay}
        onChange={(e) => setInterventionDay(Number(e.target.value))}
        aria-describedby="intervention-day-value"
      />
      <output id="intervention-day-value" htmlFor="intervention-day">
        day {scenario.interventionDay}
      </output>
    </fieldset>
  );
}

function TreatedZoneControl() {
  const { allZones, scenario, setTreatedZone } = useScenario();
  if (allZones.length === 0) return null;
  return (
    <fieldset>
      <legend>2. Treated zone</legend>
      <label htmlFor="treated-zone">Zone receiving the intervention</label>
      <select
        id="treated-zone"
        value={scenario.treatedZone}
        onChange={(e) => setTreatedZone(Number(e.target.value))}
      >
        {allZones.map((z) => (
          <option key={z} value={z}>
            Zone {z}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

function ControlPoolControl() {
  const { allZones, scenario, toggleControlZone } = useScenario();
  const controlCandidates = allZones.filter((z) => z !== scenario.treatedZone);
  const usingAll = scenario.controlPool.length === 0;
  return (
    <fieldset>
      <legend>3. Control pool</legend>
      <p className="hint">
        {usingAll
          ? `Using all ${controlCandidates.length} non-treated zones. Check a box to switch to an explicit allow-list of just the zones you check (not an exclude-list).`
          : `Using ${scenario.controlPool.length} selected zone(s) as an explicit allow-list. Uncheck all to use every zone again.`}
      </p>
      <div className="zone-grid" role="group" aria-label="Control pool zone selection">
        {controlCandidates.map((z) => (
          <label key={z} className="zone-checkbox">
            <input
              type="checkbox"
              checked={scenario.controlPool.includes(z)}
              onChange={() => toggleControlZone(z)}
            />
            {z}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function DonorWeightsControl() {
  const { sc, scError, scenario, setDonorWeight, applyDonorWeights, clearDonorWeights } = useScenario();
  if (scError) {
    return (
      <fieldset>
        <legend>4. Synthetic control weights</legend>
        <p className="error" role="alert" data-testid="sc-error">
          {scError}
        </p>
      </fieldset>
    );
  }
  if (!sc) return null;
  const donorZones = Object.keys(sc.weights).map(Number).sort((a, b) => a - b);
  const isCustom = scenario.donorWeights !== undefined;
  return (
    <fieldset>
      <legend>4. Synthetic control weights</legend>
      <p className="hint">
        {isCustom ? "Custom weights applied." : "Auto-fit weights (minimizing pre-period error)."} Pre-period
        fit error (RMSPE): {sc.preRmspe.toFixed(1)}.
      </p>
      <div className="weights-list">
        {donorZones.map((z) => (
          <label key={z} className="weight-row">
            <span>Zone {z}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              defaultValue={sc.weights[z]}
              aria-label={`Donor weight for zone ${z}`}
              onChange={(e) => setDonorWeight(z, Number(e.target.value))}
            />
            <span data-testid={`weight-value-${z}`}>{(sc.weights[z] * 100).toFixed(0)}%</span>
          </label>
        ))}
      </div>
      <div className="button-row">
        <button type="button" onClick={applyDonorWeights}>
          Apply weights
        </button>
        {isCustom && (
          <button type="button" onClick={clearDonorWeights}>
            Use auto-fit weights
          </button>
        )}
      </div>
      <dl className="result">
        <dt>Synthetic control gap, post-period average</dt>
        <dd data-testid="sc-att-value">{sc.attPostMean.toFixed(1)}</dd>
      </dl>
    </fieldset>
  );
}

function PlaceboControl() {
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

function PretrendBadge() {
  const { pretrend } = useScenario();
  if (!pretrend) return null;
  return (
    <p className="hint" data-testid="pretrend-badge" data-passes={pretrend.passes}>
      Pretrend diagnostic: {pretrend.passes ? "PASS" : "FAIL"} (slope p-value{" "}
      {pretrend.slopePvalue.toFixed(3)}). A significant pre-trend means the parallel-trends
      assumption is suspect for this treated unit and donor pool.
    </p>
  );
}

function Lab() {
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
        <code>specifications/DATA_CONTRACT.yaml</code>. All six controls below trigger a real
        recomputation, never a cosmetic change.
      </p>

      <InterventionDateControl />
      <TreatedZoneControl />
      <ControlPoolControl />
      <DonorWeightsControl />
      <PlaceboControl />
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

      <PretrendBadge />
    </main>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <Lab />
    </ScenarioProvider>
  );
}

export default App;

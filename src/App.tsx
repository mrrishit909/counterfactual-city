import { ScenarioProvider, useScenario } from "./engine/ScenarioContext";
import { Chapter2Treatment } from "./scenes/Chapter2Treatment";
import { Chapter3MatchedControls } from "./scenes/Chapter3MatchedControls";
import { Chapter4Counterfactual } from "./scenes/Chapter4Counterfactual";
import { Chapter5Diagnostics } from "./scenes/Chapter5Diagnostics";
import { Chapter6Limitations } from "./scenes/Chapter6Limitations";
import { ChapterNav } from "./scenes/ChapterNav";
import { IntroSequence } from "./scenes/IntroSequence";
import { ResultCaveat } from "./scenes/ResultCaveat";
import "./App.css";
import "./scenes/scenes.css";

export function Lab() {
  const { load, did, didError } = useScenario();

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
        <code>specifications/DATA_CONTRACT.yaml</code>. All six controls on this page now live in
        chapters 2-6's own sections above; see chapter 6 for the full identification-assumptions
        disclaimer adjacent to these results. Reset Scenario is always reachable from the chapter
        navigation.
      </p>

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
      {did && <ResultCaveat />}
    </main>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <ChapterNav />
      <IntroSequence>
        <Chapter2Treatment />
        <Chapter3MatchedControls />
        <Chapter4Counterfactual />
        <Chapter5Diagnostics />
        <Chapter6Limitations />
        <Lab />
      </IntroSequence>
    </ScenarioProvider>
  );
}

export default App;

import { useScenario } from "../engine/ScenarioContext";
import { ResultCaveat } from "./ResultCaveat";
import { unitForOutcome } from "./resultVisualEncoding";

// Stage 4 lab integration: this used to be the ONLY content in a standalone "Lab" <main> section
// at the very bottom of the page, disconnected from CTY-INT-001/002 (intervention date, treated
// zone), the two controls whose own `then` clause requires "the changed quantity is visibly
// explained." A visitor changing the intervention date in chapter 2 had to scroll past 4 more
// chapters to see the number actually change. Moved here, into chapter 2 itself, next to the
// controls that drive it. Also handles the panel's own load/error states (previously the standalone
// Lab's job): chapters render even before data loads (useScenario's own fallback defaultScenario,
// see ScenarioContext.tsx), so SOMETHING still needs to show a real "failed to load" message
// reachably when the fetch fails, per e2e/intro.spec.ts's own regression test for this; this panel
// is now that one place, not a second disconnected one.
export function DiDResultPanel() {
  const { load, did, didError, scenario } = useScenario();

  if (load.status === "loading") {
    return (
      <p className="hint" data-state="loading" data-testid="did-result-loading">
        Loading panel data{"…"}
      </p>
    );
  }
  if (load.status === "error") {
    return (
      <p className="error" role="alert" data-state="error" data-testid="did-result-error">
        Failed to load the scenario data: {load.message}
      </p>
    );
  }

  const unit = unitForOutcome(scenario.outcome);

  return (
    <div data-state="ready">
      {didError && (
        <p className="error" role="alert" data-testid="estimator-error">
          {didError}
        </p>
      )}
      {did && (
        <dl className="result" data-testid="did-result">
          <dt>Difference-in-differences estimate (ATT)</dt>
          <dd data-testid="att-value">
            {did.att.toFixed(1)} {unit}
          </dd>
          <dt>Treated zone, pre to post</dt>
          <dd>
            {did.preTreatedMean.toFixed(1)} {"→"} {did.postTreatedMean.toFixed(1)} {unit}
          </dd>
          <dt>Control zones, pre to post</dt>
          <dd>
            {did.preControlMean.toFixed(1)} {"→"} {did.postControlMean.toFixed(1)} {unit}
          </dd>
        </dl>
      )}
      {did && <ResultCaveat />}
    </div>
  );
}

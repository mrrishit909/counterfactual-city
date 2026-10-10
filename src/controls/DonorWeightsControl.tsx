import { useScenario } from "../engine/ScenarioContext";

// CTY-INT-004, the flagship interaction. Split out of App.tsx into its own module (same reasoning
// as the other controls/*.tsx modules) so chapter 4 (src/scenes/Chapter4Counterfactual.tsx) can
// import it without a circular dependency on App.tsx.

export function DonorWeightsControl() {
  const { sc, scError, scenario, weightsRevision, setDonorWeight, applyDonorWeights, clearDonorWeights } =
    useScenario();
  if (!sc) return null;
  const donorZones = Object.keys(sc.weights).map(Number).sort((a, b) => a - b);
  const isCustom = scenario.donorWeights !== undefined;
  return (
    <fieldset>
      <legend>4. Synthetic control weights</legend>
      {scError && (
        // A real dead end an independent adversarial review found: this error used to REPLACE the
        // entire control (all sliders + Apply button gone from the DOM), the only way back was an
        // undocumented workaround (touching an unrelated control elsewhere on the page) or the
        // global Reset Scenario, which discards unrelated scenario state too. The sliders below now
        // always render (ScenarioContext.tsx keeps the last successfully computed `sc` around
        // specifically so this control surface never has to disappear), so the error is a banner
        // next to a still-usable control, not a dead end.
        <p className="error" role="alert" data-testid="sc-error">
          {scError} Adjust the sliders below so they sum to 1, or use auto-fit weights, and apply
          again.
        </p>
      )}
      <p className="hint">
        {isCustom ? "Custom weights applied." : "Auto-fit weights (minimizing pre-period error)."} Pre-period fit
        error (RMSPE): {sc.preRmspe.toFixed(1)}.
      </p>
      <div className="weights-list">
        {donorZones.map((z) => (
          // Uncontrolled slider (defaultValue, for smooth drag performance): keyed on
          // weightsRevision too so applying/clearing/resetting weights forces a real remount, not
          // just a defaultValue prop change React would otherwise ignore on an existing DOM node.
          // An independent architecture review caught the thumb visibly drifting from the actual
          // applied weight without this; see LIMITATIONS.md.
          <label key={`${z}-${weightsRevision}`} className="weight-row">
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

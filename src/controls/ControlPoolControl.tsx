import { useScenario } from "../engine/ScenarioContext";

// CTY-INT-003. Split out of App.tsx into its own module (same reasoning as
// src/controls/TreatmentControls.tsx) so chapter 3 (src/scenes/Chapter3MatchedControls.tsx) can
// import it without creating a circular dependency with App.tsx.

export function ControlPoolControl() {
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
            <input type="checkbox" checked={scenario.controlPool.includes(z)} onChange={() => toggleControlZone(z)} />
            {z}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

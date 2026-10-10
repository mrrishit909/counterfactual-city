import { useScenario } from "../engine/ScenarioContext";
import type { Outcome } from "../engine/types";

// CTY-INT-006. Split out of App.tsx into its own module (same reasoning as the other
// controls/*.tsx modules) so chapter 6 (src/scenes/Chapter6Limitations.tsx) can import it without a
// circular dependency on App.tsx.

const OUTCOME_LABELS: Record<Outcome, string> = {
  trip_volume: "Trip volume (trips/day)",
  avg_speed_kmh: "Average speed (km/h)",
  transit_ridership: "Transit ridership (riders/day)",
};

export function OutcomeControl() {
  const { load, scenario, setOutcome } = useScenario();
  if (load.status !== "ready") return null;
  return (
    <fieldset>
      <legend>6. Outcome variable</legend>
      <label htmlFor="outcome-select">Outcome series</label>
      <select id="outcome-select" value={scenario.outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
        {load.panel.meta.outcomes.map((o) => (
          <option key={o} value={o}>
            {OUTCOME_LABELS[o]}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

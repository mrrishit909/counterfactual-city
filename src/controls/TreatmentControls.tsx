import { useScenario } from "../engine/ScenarioContext";

// CTY-INT-001 and CTY-INT-002. Split out of App.tsx into their own module (not left inline there)
// specifically so Chapter 2 (src/scenes/Chapter2Treatment.tsx) can import them without creating a
// circular dependency with App.tsx, which itself needs to import Chapter2Treatment to render it.

export function InterventionDateControl() {
  const { load, scenario, setInterventionDay } = useScenario();
  if (load.status !== "ready") return null;
  const { meta } = load.panel;
  return (
    <fieldset>
      <legend>1. Intervention date</legend>
      <label htmlFor="intervention-day">
        Intervention day (1{"–"}
        {meta.n_days - 1})
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

export function TreatedZoneControl() {
  const { allZones, scenario, setTreatedZone } = useScenario();
  if (allZones.length === 0) return null;
  return (
    <fieldset>
      <legend>2. Treated zone</legend>
      <label htmlFor="treated-zone">Zone receiving the intervention</label>
      <select id="treated-zone" value={scenario.treatedZone} onChange={(e) => setTreatedZone(Number(e.target.value))}>
        {allZones.map((z) => (
          <option key={z} value={z}>
            Zone {z}
          </option>
        ))}
      </select>
    </fieldset>
  );
}

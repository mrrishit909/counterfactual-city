// Maps a REAL analytical result (never a decorative/random value) to the city visualization's
// color/intensity encoding. A negative effect (outcome fell in the treated zone) reads as the
// dossier's accent red; a positive effect reads as the dossier's accent blue; magnitude maps to
// both saturation (via opacity in CityStage) and pulse intensity. Pure function, unit-testable
// without a DOM.
export interface ResultVisualEncoding {
  treatedColor: string;
  pulseIntensity: number; // 0..1, clamped
}

const RED = "#D65343";
const BLUE = "#4B84C5";

export function encodeResult(att: number, scale: number): ResultVisualEncoding {
  const magnitude = scale > 0 ? Math.abs(att) / scale : 0;
  return {
    treatedColor: att < 0 ? RED : BLUE,
    pulseIntensity: Math.min(1, magnitude),
  };
}

// An independent review caught a real calibration gap: a single hardcoded scale (300) was used
// for every outcome, but the panel's 3 outcomes have genuinely different units and magnitudes
// (analysis/data/synthetic_panel.py's declared TRUE_ATT: trip_volume ~180, avg_speed_kmh ~3.2,
// transit_ridership ~240), so a scale calibrated for trip_volume left avg_speed_kmh's pulse
// intensity near-invisible and could saturate transit_ridership's. Each scale here is ~1.67x the
// outcome's own true injected effect, so a solver estimate near the true effect reads as a
// strong but not instantly-maxed pulse, consistent across all 3 outcomes.
const DEFAULT_SCALE_BY_OUTCOME: Record<string, number> = {
  trip_volume: 300,
  avg_speed_kmh: 6,
  transit_ridership: 400,
};

export function defaultScaleForOutcome(outcome: string): number {
  return DEFAULT_SCALE_BY_OUTCOME[outcome] ?? 300;
}

// Every numeric result on the page shares this outcome's units; a second self-review found none of
// them actually showed a unit (the ATT, the synthetic-control gap), easy to misread as unitless or
// to confuse across outcomes.
const UNIT_BY_OUTCOME: Record<string, string> = {
  trip_volume: "trips/day",
  avg_speed_kmh: "km/h",
  transit_ridership: "riders/day",
};

export function unitForOutcome(outcome: string): string {
  return UNIT_BY_OUTCOME[outcome] ?? "";
}

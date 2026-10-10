export type Outcome = "trip_volume" | "avg_speed_kmh" | "transit_ridership";

export interface PanelRow {
  zone: number;
  day: number;
  trip_volume: number;
  avg_speed_kmh: number;
  transit_ridership: number;
  treated: boolean;
  post: boolean;
}

export interface PanelMeta {
  n_zones: number;
  n_days: number;
  intervention_day: number;
  treated_zone: number;
  outcomes: Outcome[];
  checksum_sha256: string;
  data_strategy: string;
}

export interface PanelFixture {
  meta: PanelMeta;
  rows: PanelRow[];
}

/** Analytical scenario state (CTY-INT-001..006). Never mutated by presentation/camera/scroll code,
 * per the CASCADIA-derived hard rule in CLAUDE.md ("animation state must remain separate from
 * analytical state"). */
export interface ScenarioState {
  interventionDay: number;
  treatedZone: number;
  controlPool: number[];
  outcome: Outcome;
  /** undefined = synthetic-control weights are auto-fit; present = user-adjusted (CTY-INT-004). */
  donorWeights?: Record<number, number>;
}

export interface DiDResult {
  att: number;
  treatedZone: number;
  interventionDay: number;
  outcome: Outcome;
  preTreatedMean: number;
  preControlMean: number;
  postTreatedMean: number;
  postControlMean: number;
}

// Browser-side causal-inference estimators. This is a TypeScript PORT of
// analysis/models/estimators.py, the Python oracle, checked for numerical parity against it in
// src/engine/estimators.test.ts (CTY-MATH-001: "an independent numerical baseline agrees within a
// stated tolerance"). The Python file remains the source of truth; this file is validated against
// it, never the reverse.
import type { DiDResult, Outcome, PanelRow } from "./types";

export function diffInDiff(
  rows: PanelRow[],
  outcome: Outcome,
  treatedZone: number,
  interventionDay: number,
  controlZones?: number[],
): DiDResult {
  if (rows.length === 0) {
    throw new Error("panel is empty");
  }
  const zones = new Set(rows.map((r) => r.zone));
  if (!zones.has(treatedZone)) {
    throw new Error(`treated_zone ${treatedZone} not present in panel`);
  }
  const days = rows.map((r) => r.day);
  const dayMin = Math.min(...days);
  const dayMax = Math.max(...days);
  if (!(dayMin < interventionDay && interventionDay <= dayMax)) {
    throw new Error(
      `intervention_day ${interventionDay} outside observed range (${dayMin}, ${dayMax}]`,
    );
  }

  let pool = controlZones ?? [...zones].filter((z) => z !== treatedZone);
  pool = pool.filter((z) => z !== treatedZone);
  if (pool.length === 0) {
    throw new Error("control pool is empty (after excluding the treated zone)");
  }
  const poolSet = new Set(pool);

  const mean = (vals: number[]): number => {
    if (vals.length === 0) return NaN;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const pre = rows.filter((r) => r.day < interventionDay);
  const post = rows.filter((r) => r.day >= interventionDay);

  const treatedPre = mean(pre.filter((r) => r.zone === treatedZone).map((r) => r[outcome]));
  const treatedPost = mean(post.filter((r) => r.zone === treatedZone).map((r) => r[outcome]));
  const controlPre = mean(pre.filter((r) => poolSet.has(r.zone)).map((r) => r[outcome]));
  const controlPost = mean(post.filter((r) => poolSet.has(r.zone)).map((r) => r[outcome]));

  if ([treatedPre, treatedPost, controlPre, controlPost].some((v) => Number.isNaN(v))) {
    throw new Error("insufficient observations in one of the four DiD cells");
  }

  const att = treatedPost - treatedPre - (controlPost - controlPre);
  return {
    att,
    treatedZone,
    interventionDay,
    outcome,
    preTreatedMean: treatedPre,
    preControlMean: controlPre,
    postTreatedMean: treatedPost,
    postControlMean: controlPost,
  };
}

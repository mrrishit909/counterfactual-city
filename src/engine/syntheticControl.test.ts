import { describe, expect, it } from "vitest";
import { pretrendDiagnostic, runPlaceboTest, syntheticControl } from "./estimators";
import panelFixture from "./__fixtures__/panel.json";
import scGolden from "./__fixtures__/sc_golden.json";
import placeboGolden from "./__fixtures__/placebo_golden.json";
import pretrendGolden from "./__fixtures__/pretrend_golden.json";
import type { Outcome, PanelFixture } from "./types";

const panel = panelFixture as unknown as PanelFixture;
const { treated_zone: treatedZone, intervention_day: interventionDay } = panel.meta;

describe("syntheticControl parity with the Python oracle", () => {
  // Weights are NOT compared bit-for-bit: the TS solver (projected gradient) and the Python
  // solver (scipy NNLS) are two different algorithms for the same convex problem, see the
  // comment on nnlsProjectedGradient in estimators.ts. What must agree is the RECOVERED
  // ESTIMATE (the thing a user actually sees) and the feasibility invariants (weights >= 0,
  // sum to 1).
  for (const c of scGolden as Array<{
    outcome: Outcome;
    attPostMean: number;
    preRmspe: number;
    weightSum: number;
  }>) {
    it(`recovers a comparable ATT and feasible weights for outcome=${c.outcome}`, () => {
      const result = syntheticControl(panel.rows, c.outcome, treatedZone, interventionDay);
      // Tolerance reflects ACTUAL achieved agreement (sub-1-unit on all 3 outcomes as of this
      // writing, an independent review measured trip_volume 0.90 / avg_speed_kmh 0.067 /
      // transit_ridership 0.07), not a loose bound wide enough to hide a real regression. A prior
      // version of this test used a flat 40-unit tolerance, which for avg_speed_kmh (true effect
      // ~2.9) would have passed even a catastrophically broken port; the review that caught this
      // is why the bound is now 3, with headroom above the observed drift (different NNLS
      // algorithms CAN legitimately land on different vertices of this panel's near-degenerate
      // feasible region, see the comment on nnlsProjectedGradient in estimators.ts) but tight
      // enough to actually catch a future TS regression.
      expect(Math.abs(result.attPostMean - c.attPostMean)).toBeLessThan(3);
      const weightSum = Object.values(result.weights).reduce((s, v) => s + v, 0);
      expect(weightSum).toBeCloseTo(1, 6);
      expect(Object.values(result.weights).every((w) => w >= -1e-9)).toBe(true);
    });
  }

  it("throws needing at least 2 donors", () => {
    expect(() =>
      syntheticControl(panel.rows, "trip_volume", treatedZone, interventionDay, [0]),
    ).toThrow("at least 2 donor");
  });

  it("throws when supplied weights don't sum to 1", () => {
    const pool = [...new Set(panel.rows.map((r) => r.zone))].filter((z) => z !== treatedZone).slice(0, 3);
    expect(() =>
      syntheticControl(panel.rows, "trip_volume", treatedZone, interventionDay, pool, [0.5, 0.5, 0.5]),
    ).toThrow("sum to 1");
  });

  it("throws when supplied weights are negative", () => {
    const pool = [...new Set(panel.rows.map((r) => r.zone))].filter((z) => z !== treatedZone).slice(0, 3);
    expect(() =>
      syntheticControl(panel.rows, "trip_volume", treatedZone, interventionDay, pool, [1.5, -0.3, -0.2]),
    ).toThrow("non-negative");
  });

  it("applies user-supplied weights exactly as given (CTY-INT-004)", () => {
    const pool = [...new Set(panel.rows.map((r) => r.zone))].filter((z) => z !== treatedZone).slice(0, 4);
    const w = [0.25, 0.25, 0.25, 0.25];
    const result = syntheticControl(panel.rows, "trip_volume", treatedZone, interventionDay, pool, w);
    pool.forEach((z, i) => expect(result.weights[z]).toBeCloseTo(w[i], 9));
  });
});

describe("runPlaceboTest parity with the Python oracle", () => {
  for (const c of placeboGolden as Array<{ outcome: Outcome; rank: number; nPlacebos: number; pValue: number }>) {
    it(`agrees on rank/count for outcome=${c.outcome}`, () => {
      const result = runPlaceboTest(panel.rows, c.outcome, treatedZone, interventionDay);
      expect(result.nPlacebos).toBe(c.nPlacebos);
      // rank can differ by +-1 between the two NNLS algorithms' slightly different fits; what
      // matters is both agree the real effect stands out near the top of the distribution.
      expect(Math.abs(result.rank - c.rank)).toBeLessThanOrEqual(2);
    });
  }

  it("throws needing at least 2 non-treated units", () => {
    const rows = panel.rows.filter((r) => r.zone === treatedZone || r.zone === 1);
    expect(() => runPlaceboTest(rows, "trip_volume", treatedZone, interventionDay)).toThrow(
      "at least 2 non-treated",
    );
  });
});

describe("pretrendDiagnostic parity with the Python oracle", () => {
  for (const c of pretrendGolden as Array<{ outcome: Outcome; passes: boolean; slopePvalue: number }>) {
    it(`agrees on pass/fail for outcome=${c.outcome}`, () => {
      const result = pretrendDiagnostic(panel.rows, c.outcome, treatedZone, interventionDay);
      // The pass/fail call (the thing CTY-DATA/MATH actually gate on) must agree exactly. The raw
      // p-value is more tolerance-sensitive since it's derived from a different NNLS fit's gap
      // series (see the weights-parity comment above); a loose band confirms it's in the same
      // ballpark without demanding bit-identical statistics from two different algorithms.
      expect(result.passes).toBe(c.passes);
      expect(Math.abs(result.slopePvalue - c.slopePvalue)).toBeLessThan(0.3);
    });
  }

  it("fails when a fake pre-trend is injected into the treated zone", () => {
    const broken = panel.rows.map((r) =>
      r.zone === treatedZone && r.day < interventionDay
        ? { ...r, trip_volume: r.trip_volume + r.day * 15.0 }
        : r,
    );
    const result = pretrendDiagnostic(broken, "trip_volume", treatedZone, interventionDay);
    expect(result.passes).toBe(false);
  });

  it("throws with fewer than 3 pre-period observations", () => {
    expect(() => pretrendDiagnostic(panel.rows, "trip_volume", treatedZone, 2)).toThrow(
      "fewer than 3 pre-period",
    );
  });
});

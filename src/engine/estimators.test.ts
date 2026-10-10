import { describe, expect, it } from "vitest";
import { diffInDiff } from "./estimators";
import panelFixture from "./__fixtures__/panel.json";
import goldenCases from "./__fixtures__/did_golden.json";
import type { Outcome, PanelFixture } from "./types";

const panel = panelFixture as unknown as PanelFixture;

describe("diffInDiff parity with the Python oracle (analysis/models/estimators.py)", () => {
  for (const c of goldenCases as Array<{
    outcome: Outcome;
    interventionDay: number;
    att: number;
    preTreatedMean: number;
    preControlMean: number;
    postTreatedMean: number;
    postControlMean: number;
  }>) {
    it(`matches Python for outcome=${c.outcome} interventionDay=${c.interventionDay}`, () => {
      const result = diffInDiff(panel.rows, c.outcome, panel.meta.treated_zone, c.interventionDay);
      // Golden values came from the exact same fixture (same checksum), so this must agree near
      // machine precision, not just within a loose statistical tolerance.
      expect(result.att).toBeCloseTo(c.att, 6);
      expect(result.preTreatedMean).toBeCloseTo(c.preTreatedMean, 6);
      expect(result.preControlMean).toBeCloseTo(c.preControlMean, 6);
      expect(result.postTreatedMean).toBeCloseTo(c.postTreatedMean, 6);
      expect(result.postControlMean).toBeCloseTo(c.postControlMean, 6);
    });
  }
});

describe("diffInDiff boundary/infeasible cases (mirrors the Python test suite)", () => {
  it("throws on an empty panel", () => {
    expect(() => diffInDiff([], "trip_volume", 0, 10)).toThrow("empty");
  });

  it("throws on an unknown treated zone", () => {
    expect(() => diffInDiff(panel.rows, "trip_volume", 9999, panel.meta.intervention_day)).toThrow(
      "not present",
    );
  });

  it("throws on an out-of-range intervention day", () => {
    expect(() =>
      diffInDiff(panel.rows, "trip_volume", panel.meta.treated_zone, 99999),
    ).toThrow("outside observed range");
  });

  it("throws on an empty control pool", () => {
    expect(() =>
      diffInDiff(panel.rows, "trip_volume", panel.meta.treated_zone, panel.meta.intervention_day, [
        panel.meta.treated_zone,
      ]),
    ).toThrow("control pool is empty");
  });
});

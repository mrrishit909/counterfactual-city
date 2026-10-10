import { describe, expect, it } from "vitest";
import { computeCityLayout, computeRoadSegments, GRID_COLS, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";

describe("computeCityLayout", () => {
  it("places every zone exactly once, in bounds", () => {
    const blocks = computeCityLayout(24);
    expect(blocks).toHaveLength(24);
    expect(new Set(blocks.map((b) => b.zone)).size).toBe(24);
    for (const b of blocks) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(VIEWBOX_WIDTH);
      expect(b.y + b.height).toBeLessThanOrEqual(VIEWBOX_HEIGHT);
    }
  });

  it("places zone 0 and zone GRID_COLS on different rows, same column", () => {
    const blocks = computeCityLayout(24);
    const zone0 = blocks.find((b) => b.zone === 0)!;
    const zoneCols = blocks.find((b) => b.zone === GRID_COLS)!;
    expect(zone0.x).toBe(zoneCols.x);
    expect(zone0.y).not.toBe(zoneCols.y);
  });
});

describe("computeRoadSegments", () => {
  it("produces one horizontal segment per row and one vertical per column", () => {
    const segments = computeRoadSegments(24);
    const horizontal = segments.filter((s) => s.y1 === s.y2);
    const vertical = segments.filter((s) => s.x1 === s.x2);
    expect(horizontal).toHaveLength(4);
    expect(vertical).toHaveLength(GRID_COLS);
  });
});

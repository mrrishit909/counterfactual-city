import { describe, expect, it } from "vitest";
import { encodeResult } from "./resultVisualEncoding";

describe("encodeResult", () => {
  it("maps a negative effect to red", () => {
    expect(encodeResult(-197, 300).treatedColor).toBe("#D65343");
  });

  it("maps a positive effect to blue", () => {
    expect(encodeResult(3.2, 10).treatedColor).toBe("#4B84C5");
  });

  it("maps zero effect to blue (not negative) and zero intensity", () => {
    const r = encodeResult(0, 300);
    expect(r.treatedColor).toBe("#4B84C5");
    expect(r.pulseIntensity).toBe(0);
  });

  it("clamps intensity to [0, 1]", () => {
    expect(encodeResult(-900, 300).pulseIntensity).toBe(1);
    expect(encodeResult(-30, 300).pulseIntensity).toBeCloseTo(0.1, 5);
  });

  it("handles a zero scale without dividing by zero", () => {
    expect(encodeResult(-50, 0).pulseIntensity).toBe(0);
  });
});

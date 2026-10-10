import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import panelFixture from "./engine/__fixtures__/panel.json";

// jsdom does not drive a native <input type="range">'s value from synthetic ArrowLeft/ArrowRight
// key events the way a real browser does (the same class of tooling gap CASCADIA's own e2e suite
// documented for <select> elements), so these tests use fireEvent.change directly, matching how
// Testing Library's own docs recommend testing range inputs, while the real keyboard path is left
// to a Playwright e2e test against a real browser (e2e/intervention-date.spec.ts).

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => panelFixture,
      }),
    );
  });

  it("loads the panel, shows a real DiD estimate, and reacts to the intervention-day control", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("did-result")).toBeInTheDocument());

    const attBefore = screen.getByTestId("att-value").textContent;
    expect(attBefore).not.toBe("");

    const slider = screen.getByLabelText<HTMLInputElement>(/intervention day/i);
    fireEvent.change(slider, { target: { value: String(Number(slider.value) - 40) } });

    await waitFor(() => {
      const attAfter = screen.getByTestId("att-value").textContent;
      expect(attAfter).not.toBe(attBefore);
    });
  });

  it("Reset Scenario restores the baseline intervention day", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("did-result")).toBeInTheDocument());

    const slider = screen.getByLabelText<HTMLInputElement>(/intervention day/i);
    const baseline = slider.value;

    fireEvent.change(slider, { target: { value: String(Number(slider.value) - 40) } });
    expect(slider.value).not.toBe(baseline);

    fireEvent.click(screen.getByRole("button", { name: /reset scenario/i }));
    expect(slider.value).toBe(baseline);
  });
});

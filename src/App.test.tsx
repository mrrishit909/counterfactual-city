import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterventionDateControl } from "./controls/TreatmentControls";
import { ScenarioProvider } from "./engine/ScenarioContext";
import panelFixture from "./engine/__fixtures__/panel.json";
import { ChapterNav } from "./scenes/ChapterNav";
import { DiDResultPanel } from "./scenes/DiDResultPanel";

// jsdom does not drive a native <input type="range">'s value from synthetic ArrowLeft/ArrowRight
// key events the way a real browser does (the same class of tooling gap CASCADIA's own e2e suite
// documented for <select> elements), so these tests use fireEvent.change directly, matching how
// Testing Library's own docs recommend testing range inputs, while the real keyboard path is left
// to a Playwright e2e test against a real browser (e2e/smoke.spec.ts).
//
// Renders <DiDResultPanel/> directly (the result panel, now hosted inside Chapter2Treatment.tsx
// in the real app), not the full <App/> (which wraps everything in <IntroSequence>, a pinned
// ScrollTrigger scene): jsdom cannot correctly revert ScrollTrigger's pin-spacer DOM restructuring
// on unmount (confirmed directly: RTL's automatic cleanup throws "NotFoundError: the node to be
// removed is not a child of this node" even after explicitly killing every ScrollTrigger in
// test-setup.ts's afterEach), a jsdom limitation, not a real-browser one, Playwright's e2e suite
// (e2e/smoke.spec.ts, e2e/intro.spec.ts, e2e/chapter2.spec.ts) exercises the full pinned App in an
// actual browser instead, which is the correct place to test scroll-pin behavior anyway.

describe("DiDResultPanel", () => {
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
    // InterventionDateControl and DiDResultPanel both live inside Chapter2Treatment.tsx in the
    // real app; rendered alongside each other here, the same composition, without
    // Chapter2Treatment's own GSAP scene (not needed to test that the shared scenario state
    // correctly connects the two).
    render(
      <ScenarioProvider>
        <InterventionDateControl />
        <DiDResultPanel />
      </ScenarioProvider>,
    );
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
    // Reset Scenario lives in the always-reachable ChapterNav (src/scenes/ChapterNav.tsx);
    // rendered alongside here, without IntroSequence's own GSAP scene (not needed to test that the
    // shared scenario state correctly connects the two; ChapterNav itself uses no GSAP).
    render(
      <ScenarioProvider>
        <ChapterNav />
        <InterventionDateControl />
        <DiDResultPanel />
      </ScenarioProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("did-result")).toBeInTheDocument());

    const slider = screen.getByLabelText<HTMLInputElement>(/intervention day/i);
    const baseline = slider.value;

    fireEvent.change(slider, { target: { value: String(Number(slider.value) - 40) } });
    expect(slider.value).not.toBe(baseline);

    fireEvent.click(screen.getByRole("button", { name: /reset scenario/i }));
    expect(slider.value).toBe(baseline);
  });
});

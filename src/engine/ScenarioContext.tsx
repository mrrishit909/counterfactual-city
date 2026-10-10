import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { diffInDiff } from "./estimators";
import { loadPanel } from "./loadPanel";
import type { DiDResult, Outcome, PanelFixture, ScenarioState } from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; panel: PanelFixture };

interface ScenarioContextValue {
  load: LoadState;
  scenario: ScenarioState;
  result: DiDResult | null;
  error: string | null;
  setInterventionDay: (day: number) => void;
  setOutcome: (outcome: Outcome) => void;
  reset: () => void;
}

const ScenarioCtx = createContext<ScenarioContextValue | null>(null);

function defaultScenario(panel: PanelFixture): ScenarioState {
  return {
    interventionDay: panel.meta.intervention_day,
    treatedZone: panel.meta.treated_zone,
    controlPool: [],
    outcome: panel.meta.outcomes[0],
  };
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [scenario, setScenario] = useState<ScenarioState | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPanel()
      .then((panel) => {
        if (cancelled) return;
        setLoad({ status: "ready", panel });
        setScenario(defaultScenario(panel));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoad({ status: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { result, error } = useMemo<{ result: DiDResult | null; error: string | null }>(() => {
    if (load.status !== "ready" || !scenario) return { result: null, error: null };
    try {
      const r = diffInDiff(load.panel.rows, scenario.outcome, scenario.treatedZone, scenario.interventionDay);
      return { result: r, error: null };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [load, scenario]);

  const setInterventionDay = useCallback((day: number) => {
    setScenario((s) => (s ? { ...s, interventionDay: day } : s));
  }, []);

  const setOutcome = useCallback((outcome: Outcome) => {
    setScenario((s) => (s ? { ...s, outcome } : s));
  }, []);

  const reset = useCallback(() => {
    if (load.status === "ready") setScenario(defaultScenario(load.panel));
  }, [load]);

  const value: ScenarioContextValue = {
    load,
    scenario: scenario ?? {
      interventionDay: 0,
      treatedZone: 0,
      controlPool: [],
      outcome: "trip_volume",
    },
    result,
    error,
    setInterventionDay,
    setOutcome,
    reset,
  };

  return <ScenarioCtx.Provider value={value}>{children}</ScenarioCtx.Provider>;
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioCtx);
  if (!ctx) throw new Error("useScenario must be used within a ScenarioProvider");
  return ctx;
}

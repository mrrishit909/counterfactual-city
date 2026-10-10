import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { diffInDiff, pretrendDiagnostic, runPlaceboTest, syntheticControl } from "./estimators";
import { loadPanel } from "./loadPanel";
import type {
  DiDResult,
  Outcome,
  PanelFixture,
  PlaceboResult,
  PretrendResult,
  ScenarioState,
  SyntheticControlResult,
} from "./types";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; panel: PanelFixture };

type PlaceboState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "done"; result: PlaceboResult }
  | { status: "error"; message: string };

interface ScenarioContextValue {
  load: LoadState;
  scenario: ScenarioState;
  allZones: number[];
  did: DiDResult | null;
  didError: string | null;
  sc: SyntheticControlResult | null;
  scError: string | null;
  pretrend: PretrendResult | null;
  placebo: PlaceboState;
  setInterventionDay: (day: number) => void;
  setTreatedZone: (zone: number) => void;
  toggleControlZone: (zone: number) => void;
  setOutcome: (outcome: Outcome) => void;
  setDonorWeight: (zone: number, weight: number) => void;
  applyDonorWeights: () => void;
  clearDonorWeights: () => void;
  runPlacebo: () => void;
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

/** Resolves the scenario's controlPool (empty = "every non-treated zone") to the explicit list the
 * estimators expect. Centralized here so every estimator call interprets "empty" identically. */
function resolvePool(scenario: ScenarioState): number[] | undefined {
  if (scenario.controlPool.length === 0) return undefined;
  return scenario.controlPool.filter((z) => z !== scenario.treatedZone);
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [scenario, setScenario] = useState<ScenarioState | null>(null);
  const [pendingWeights, setPendingWeights] = useState<Record<number, number> | null>(null);
  const [placebo, setPlacebo] = useState<PlaceboState>({ status: "idle" });

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

  const allZones = useMemo(
    () => (load.status === "ready" ? [...new Set(load.panel.rows.map((r) => r.zone))].sort((a, b) => a - b) : []),
    [load],
  );

  const { did, didError } = useMemo<{ did: DiDResult | null; didError: string | null }>(() => {
    if (load.status !== "ready" || !scenario) return { did: null, didError: null };
    try {
      const r = diffInDiff(
        load.panel.rows,
        scenario.outcome,
        scenario.treatedZone,
        scenario.interventionDay,
        resolvePool(scenario),
      );
      return { did: r, didError: null };
    } catch (e) {
      return { did: null, didError: e instanceof Error ? e.message : String(e) };
    }
  }, [load, scenario]);

  const { sc, scError } = useMemo<{ sc: SyntheticControlResult | null; scError: string | null }>(() => {
    if (load.status !== "ready" || !scenario) return { sc: null, scError: null };
    try {
      const pool = resolvePool(scenario);
      // resolvePool returns undefined to mean "every non-treated zone", which syntheticControl is
      // happy to accept directly, but a donorWeights vector is keyed by an explicit pool ORDER, so
      // when applying custom weights we must resolve the same effective pool the estimator would
      // have defaulted to (allZones minus treated, sorted), not pass `undefined` through, which
      // would silently skip applying the weights at all (a real bug caught by e2e/controls.spec.ts
      // when the default "use all zones" pool was active, not just a narrowed one).
      const effectivePool = pool ?? allZones.filter((z) => z !== scenario.treatedZone);
      const weightsArray = scenario.donorWeights
        ? effectivePool.map((z) => scenario.donorWeights![z] ?? 0)
        : undefined;
      const r = syntheticControl(
        load.panel.rows,
        scenario.outcome,
        scenario.treatedZone,
        scenario.interventionDay,
        pool,
        weightsArray,
      );
      return { sc: r, scError: null };
    } catch (e) {
      return { sc: null, scError: e instanceof Error ? e.message : String(e) };
    }
  }, [load, scenario, allZones]);

  const pretrend = useMemo<PretrendResult | null>(() => {
    if (load.status !== "ready" || !scenario) return null;
    try {
      return pretrendDiagnostic(
        load.panel.rows,
        scenario.outcome,
        scenario.treatedZone,
        scenario.interventionDay,
        resolvePool(scenario),
      );
    } catch {
      return null; // pretrend needs >= 3 pre-period points; silently absent, not an app error
    }
  }, [load, scenario]);

  // Clear a stale custom weight vector whenever anything that changes its dimension/meaning
  // changes (pool, treated zone, outcome, intervention day), so a leftover weight vector is never
  // silently applied to a different donor pool than it was fit for.
  useEffect(() => {
    setScenario((s) => (s && s.donorWeights ? { ...s, donorWeights: undefined } : s));
    setPendingWeights(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario?.treatedZone, scenario?.outcome, scenario?.interventionDay, scenario?.controlPool.join(",")]);

  const setInterventionDay = useCallback((day: number) => {
    setScenario((s) => (s ? { ...s, interventionDay: day } : s));
  }, []);

  const setTreatedZone = useCallback((zone: number) => {
    setScenario((s) => (s ? { ...s, treatedZone: zone } : s));
  }, []);

  const toggleControlZone = useCallback((zone: number) => {
    setScenario((s) => {
      if (!s) return s;
      const has = s.controlPool.includes(zone);
      return {
        ...s,
        controlPool: has ? s.controlPool.filter((z) => z !== zone) : [...s.controlPool, zone].sort((a, b) => a - b),
      };
    });
  }, []);

  const setOutcome = useCallback((outcome: Outcome) => {
    setScenario((s) => (s ? { ...s, outcome } : s));
  }, []);

  const setDonorWeight = useCallback((zone: number, weight: number) => {
    setPendingWeights((prev) => {
      const base = prev ?? (sc ? { ...sc.weights } : {});
      return { ...base, [zone]: weight };
    });
  }, [sc]);

  const applyDonorWeights = useCallback(() => {
    if (!pendingWeights) return;
    setScenario((s) => (s ? { ...s, donorWeights: pendingWeights } : s));
  }, [pendingWeights]);

  const clearDonorWeights = useCallback(() => {
    setPendingWeights(null);
    setScenario((s) => (s ? { ...s, donorWeights: undefined } : s));
  }, []);

  const runPlacebo = useCallback(() => {
    if (load.status !== "ready" || !scenario) return;
    setPlacebo({ status: "running" });
    // Synchronous today (the panel is small enough that this never blocks noticeably); kept as an
    // explicit trigger rather than auto-recomputing on every scenario change both because the
    // dossier frames CTY-INT-005 as a user-launched action ("launch placebo") and because a full
    // placebo sweep is meaningfully more expensive than the other 5 controls' single-fit cost.
    try {
      const result = runPlaceboTest(
        load.panel.rows,
        scenario.outcome,
        scenario.treatedZone,
        scenario.interventionDay,
        resolvePool(scenario),
      );
      setPlacebo({ status: "done", result });
    } catch (e) {
      setPlacebo({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [load, scenario]);

  const reset = useCallback(() => {
    if (load.status === "ready") {
      setScenario(defaultScenario(load.panel));
      setPendingWeights(null);
      setPlacebo({ status: "idle" });
    }
  }, [load]);

  const value: ScenarioContextValue = {
    load,
    scenario: scenario ?? {
      interventionDay: 0,
      treatedZone: 0,
      controlPool: [],
      outcome: "trip_volume",
    },
    allZones,
    did,
    didError,
    sc,
    scError,
    pretrend,
    placebo,
    setInterventionDay,
    setTreatedZone,
    toggleControlZone,
    setOutcome,
    setDonorWeight,
    applyDonorWeights,
    clearDonorWeights,
    runPlacebo,
    reset,
  };

  return <ScenarioCtx.Provider value={value}>{children}</ScenarioCtx.Provider>;
}

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioCtx);
  if (!ctx) throw new Error("useScenario must be used within a ScenarioProvider");
  return ctx;
}

export { resolvePool };

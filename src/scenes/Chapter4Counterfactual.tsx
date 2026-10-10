import { useMemo, useRef } from "react";
import { DonorWeightsControl } from "../controls/DonorWeightsControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { defaultScaleForOutcome, encodeResult, unitForOutcome } from "./resultVisualEncoding";
import { ResultCaveat } from "./ResultCaveat";
import { TrajectoryChart, type TrajectoryPoint } from "./TrajectoryChart";
import { useScene } from "./useScene";

const SCENE_ID = "ch4";
const OBSERVED_COLOR = "#D65343"; // --accent-red: the actual, factual treated-zone outcome
const SYNTHETIC_COLOR = "#4B84C5"; // --accent-blue: the reconstructed counterfactual series

/**
 * Chapter 4: "counterfactual" (dossier naming), the dossier's own signature flagship interaction
 * ("Two urban timelines diverge as estimator assumptions are manipulated"). Hosts CTY-INT-004
 * (adjust synthetic-control donor weights). Two city stages, side by side: the left ("observed")
 * always shows the treated zone in the dossier's accent red, the factual record; the right
 * ("synthetic counterfactual") shows it colored/pulsing by the REAL computed gap
 * (SyntheticControlResult.attPostMean, src/engine/estimators.ts), never a placeholder. The two
 * stages visually draw apart on scroll into this chapter, the literal "diverge" the dossier asks
 * for, built on the same scrub-bound GSAP timeline pattern chapters 1-2 already established.
 */
export function Chapter4Counterfactual() {
  const { sc, scenario, load } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const observedRef = useRef<HTMLDivElement>(null);
  const counterfactualRef = useRef<HTMLDivElement>(null);

  useScene(
    SCENE_ID,
    sectionRef,
    ({ gsap: g, reducedMotion }) => {
      const observed = observedRef.current;
      const counterfactual = counterfactualRef.current;
      if (!observed || !counterfactual) return;

      // An independent visual QA review caught this: a ±6% shift on a ~320px-wide stage is under
      // 10px of actual on-screen movement, imperceptible for the dossier's own billing ("two urban
      // timelines diverge," the signature flagship beat). ±22% reads as a real, deliberate
      // divergence (confirmed live: roughly 70px of movement per side at the stage's own max-width)
      // while staying well inside the two-column layout's own gap, no overlap or viewport overflow.
      const DIVERGE_PERCENT = 22;

      if (reducedMotion) {
        g.set([observed, counterfactual], { x: 0 });
        g.set(observed, { xPercent: -DIVERGE_PERCENT });
        g.set(counterfactual, { xPercent: DIVERGE_PERCENT });
        return;
      }

      g.set([observed, counterfactual], { xPercent: 0 });
      g.timeline({
        scrollTrigger: {
          id: `${SCENE_ID}-pin`,
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      })
        .to(observed, { xPercent: -DIVERGE_PERCENT, duration: 1, ease: "none" }, 0)
        .to(counterfactual, { xPercent: DIVERGE_PERCENT, duration: 1, ease: "none" }, 0);
    },
    // A real bug was found live building this chapter: this trigger's FIRST measurement pass
    // (synchronous at mount, before the async scenario fetch resolves) landed its start position
    // well short of this section's real document offset, trapping the scrub permanently at its end
    // state even when scrolled to the chapter's true top. Root-caused and fixed once, for every
    // chapter, in IntroSequence.tsx (an explicit ScrollTrigger.refresh() when scenario data finishes
    // loading) rather than papering over it per-chapter with an unrelated dependency.
    [],
  );

  const visual = sc ? encodeResult(sc.attPostMean, defaultScaleForOutcome(scenario.outcome)) : undefined;
  const unit = unitForOutcome(scenario.outcome);

  // The literal flagship chart: the treated zone's REAL observed series next to the REAL
  // synthetic-control reconstruction for the same days (synthetic[day] = observed[day] -
  // gapByDay[day], the estimator's own per-day gap, src/engine/estimators.ts), redrawing whenever
  // donor weights change. A second self-review found this chapter was missing a time axis
  // entirely: the two city stages diverging on scroll shows THAT something differs, not WHAT, and
  // the dossier's own "as estimator assumptions are manipulated" phrase means the chart should
  // redraw when the visitor edits weights, not just when they scroll.
  const { observedSeries, syntheticSeries } = useMemo(() => {
    if (load.status !== "ready" || !sc) return { observedSeries: [] as TrajectoryPoint[], syntheticSeries: [] as TrajectoryPoint[] };
    const observed = load.panel.rows
      .filter((r) => r.zone === scenario.treatedZone)
      .sort((a, b) => a.day - b.day)
      .map((r) => ({ day: r.day, value: r[scenario.outcome] }));
    const synthetic = observed
      .filter((p) => p.day in sc.gapByDay)
      .map((p) => ({ day: p.day, value: p.value - sc.gapByDay[p.day] }));
    return { observedSeries: observed, syntheticSeries: synthetic };
  }, [load, sc, scenario.treatedZone, scenario.outcome]);

  return (
    <section
      id="ch4"
      ref={sectionRef}
      className="chapter chapter-counterfactual"
      data-testid="chapter-4"
      aria-labelledby="ch4-heading"
    >
      <div className="chapter-sticky chapter-sticky-flagship">
        <div className="flagship-header">
          <p className="chapter-kicker">04 - Counterfactual</p>
          <h2 id="ch4-heading">One city. Two timelines.</h2>
          {sc && (
            <>
              <p className="flagship-gap" data-testid="flagship-gap">
                Gap (observed minus synthetic): <strong>{sc.attPostMean.toFixed(1)}</strong> {unit}
              </p>
              <p className="hint">
                The synthetic stage&rsquo;s color/pulse encodes this gap&rsquo;s size and direction,
                not a predicted value for that timeline on its own.
              </p>
              <ResultCaveat kind="counterfactual-gap" />
            </>
          )}
        </div>
        <div className="flagship-split">
          <div className="flagship-timeline" ref={observedRef} data-testid="observed-timeline">
            <p className="timeline-label">Observed</p>
            <CityStage
              instanceId="ch4-observed"
              nZones={24}
              treatedZone={scenario.treatedZone}
              zoneColors={{ [scenario.treatedZone]: OBSERVED_COLOR }}
            />
          </div>
          <div className="flagship-timeline" ref={counterfactualRef} data-testid="counterfactual-timeline">
            <p className="timeline-label">Synthetic counterfactual</p>
            <CityStage
              instanceId="ch4-counterfactual"
              nZones={24}
              treatedZone={scenario.treatedZone}
              zoneColors={visual ? { [scenario.treatedZone]: visual.treatedColor } : undefined}
              treatedPulseIntensity={visual?.pulseIntensity}
            />
          </div>
        </div>
        {observedSeries.length > 0 && (
          <div className="flagship-chart">
            <TrajectoryChart
              instanceId="ch4"
              observed={observedSeries}
              synthetic={syntheticSeries}
              interventionDay={scenario.interventionDay}
              unit={unit}
              observedColor={OBSERVED_COLOR}
              syntheticColor={SYNTHETIC_COLOR}
            />
            <p className="trajectory-legend">
              <span className="trajectory-legend-swatch" style={{ background: OBSERVED_COLOR }} /> observed
              <span className="trajectory-legend-swatch trajectory-legend-swatch-dashed" style={{ borderColor: SYNTHETIC_COLOR }} />{" "}
              synthetic counterfactual
            </p>
          </div>
        )}
        <div className="flagship-controls">
          <DonorWeightsControl />
        </div>
      </div>
    </section>
  );
}

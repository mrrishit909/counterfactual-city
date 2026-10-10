import { useRef } from "react";
import { DonorWeightsControl } from "../controls/DonorWeightsControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { defaultScaleForOutcome, encodeResult } from "./resultVisualEncoding";
import { useScene } from "./useScene";

const SCENE_ID = "ch4";
const OBSERVED_COLOR = "#D65343"; // --accent-red: the actual, factual treated-zone outcome

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
  const { sc, scenario } = useScenario();
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

      if (reducedMotion) {
        g.set([observed, counterfactual], { x: 0 });
        g.set(observed, { xPercent: -6 });
        g.set(counterfactual, { xPercent: 6 });
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
        .to(observed, { xPercent: -6, duration: 1, ease: "none" }, 0)
        .to(counterfactual, { xPercent: 6, duration: 1, ease: "none" }, 0);
    },
    // Re-run once scenario data actually loads (not just on initial mount): chapters 2/3 mount
    // ahead of chapter 4 in the DOM, and the FIRST ScrollTrigger measurement pass (which happens
    // synchronously at mount, before the async scenario fetch resolves) was found live to measure
    // this trigger's start position well short of its real document offset, trapping the scrub
    // permanently at its end state even when scrolled to the true top of the chapter. Chapter2's
    // own identical scroll-driven scene already depends on `scenario.treatedZone` for its own
    // (unrelated) reframe-on-change behavior, which incidentally forces exactly this re-measurement
    // once data loads; chapter 4 needs the same re-run deliberately.
    [scenario.treatedZone],
  );

  const visual = sc ? encodeResult(sc.attPostMean, defaultScaleForOutcome(scenario.outcome)) : undefined;

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
          <p className="chapter-kicker">04 &mdash; Counterfactual</p>
          <h2 id="ch4-heading">One city. Two timelines.</h2>
          {sc && (
            <p className="flagship-gap" data-testid="flagship-gap">
              Gap: <strong>{sc.attPostMean.toFixed(1)}</strong>
            </p>
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
        <div className="flagship-controls">
          <DonorWeightsControl />
        </div>
      </div>
    </section>
  );
}

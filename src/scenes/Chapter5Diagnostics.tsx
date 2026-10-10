import { useRef } from "react";
import { PlaceboControl } from "../controls/PlaceboControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { useScene } from "./useScene";

const SCENE_ID = "ch5";

function PretrendBadge() {
  const { pretrend } = useScenario();
  if (!pretrend) return null;
  return (
    <p className="hint" data-testid="pretrend-badge" data-passes={pretrend.passes}>
      Pretrend diagnostic: {pretrend.passes ? "PASS" : "FAIL"} (slope p-value{" "}
      {pretrend.slopePvalue.toFixed(3)}). A significant pre-trend means the parallel-trends
      assumption is suspect for this treated unit and donor pool.
    </p>
  );
}

/**
 * Chapter 5: "diagnostics" (dossier naming), the "focused inspector" archetype
 * (docs/ART_DIRECTION.md section 5: grid + an inspector rail, right-anchored). Hosts CTY-INT-005
 * (launch a placebo test). The whole city grid stays in frame throughout, the same deliberate
 * choice chapter 3 already made for its own "comparative view" archetype: a diagnostic looks at
 * the whole panel at once, not a single zoomed-in zone, so there is no scroll-scrubbed camera move
 * here either, only a real control + real result.
 */
export function Chapter5Diagnostics() {
  const { scenario } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  useScene(
    SCENE_ID,
    sectionRef,
    ({ gsap: g }) => {
      const stage = stageRef.current;
      if (!stage) return;
      g.set(stage, { attr: { viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` } });
    },
    [],
  );

  return (
    <section
      id="ch5"
      ref={sectionRef}
      className="chapter chapter-diagnostics"
      data-testid="chapter-5"
      aria-labelledby="ch5-heading"
    >
      <div className="chapter-sticky">
        <div className="chapter-stage-wrap">
          <CityStage ref={stageRef} instanceId="ch5" nZones={24} treatedZone={scenario.treatedZone} />
        </div>
        <div className="chapter-controls">
          <p className="chapter-kicker">05 - Diagnostics</p>
          <h2 id="ch5-heading">How much should you trust this estimate?</h2>
          <p className="chapter-prose">
            A placebo test re-runs the same synthetic-control procedure on every untreated zone, as
            if each were the treated one. Where the real effect ranks in that null distribution is
            the diagnostic: a real effect buried in the middle of the pack is not distinguishable
            from noise.
          </p>
          <PlaceboControl />
          <PretrendBadge />
        </div>
      </div>
    </section>
  );
}

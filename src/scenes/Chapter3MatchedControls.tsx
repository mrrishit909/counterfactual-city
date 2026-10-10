import { useRef } from "react";
import { ControlPoolControl } from "../controls/ControlPoolControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { useScene } from "./useScene";

const SCENE_ID = "ch3";
const CONTROL_ZONE_COLOR = "#4B84C5"; // --accent-blue

/**
 * Chapter 3: "matched controls" (dossier naming). Hosts CTY-INT-003 (pick control pool), the
 * control that chooses which non-treated zones serve as the comparison group DiD and synthetic
 * control are fit against. The dossier's own archetype for this chapter is "comparative view";
 * this build ships the real, functioning control plus a real comparative tie-in to the shared city
 * visualization (every selected control zone highlighted blue, the treated zone red, a single
 * shared stage rather than a flat checkbox list with no spatial feedback), not yet the fuller
 * 3-column small-multiples trajectory comparison docs/ART_DIRECTION.md section 3 describes, which
 * remains a further visual enhancement, not silently dropped (see LIMITATIONS.md).
 */
export function Chapter3MatchedControls() {
  const { scenario, allZones } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  useScene(
    SCENE_ID,
    sectionRef,
    ({ gsap: g }) => {
      const stage = stageRef.current;
      if (!stage) return;
      // This chapter's camera stays on the full grid throughout (no per-zone push-in like
      // chapter 2, no scroll-scrubbed timeline at all): the point here is comparing MANY zones
      // at once, so the whole city staying in frame is the correct, not a missing, choice. No
      // ScrollTrigger is created since there is nothing for one to drive.
      g.set(stage, { attr: { viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}` } });
    },
    [],
  );

  const controlPool = scenario.controlPool.length > 0 ? scenario.controlPool : allZones.filter((z) => z !== scenario.treatedZone);
  const zoneColors: Record<number, string> = {};
  for (const z of controlPool) {
    if (z !== scenario.treatedZone) zoneColors[z] = CONTROL_ZONE_COLOR;
  }

  return (
    <section
      id="ch3"
      ref={sectionRef}
      className="chapter chapter-matched-controls"
      data-testid="chapter-3"
      aria-labelledby="ch3-heading"
    >
      <div className="chapter-sticky">
        <div className="chapter-controls">
          <p className="chapter-kicker">03 - Matched controls</p>
          <h2 id="ch3-heading">Choose what the treated zone is compared against</h2>
          <p className="chapter-prose">
            Every zone highlighted blue below is in the current comparison group. The estimate
            changes with every zone you add or remove, never a cosmetic preview.
          </p>
          <ControlPoolControl />
        </div>
        <div className="chapter-stage-wrap">
          <CityStage ref={stageRef} instanceId="ch3" nZones={24} treatedZone={scenario.treatedZone} zoneColors={zoneColors} />
        </div>
      </div>
    </section>
  );
}

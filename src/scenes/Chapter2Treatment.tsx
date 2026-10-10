import { useRef } from "react";
import { InterventionDateControl, TreatedZoneControl } from "../controls/TreatmentControls";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { computeCityLayout, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { useScene } from "./useScene";

const SCENE_ID = "ch2";

/**
 * Chapter 2: "treatment" (dossier naming, docs/ART_DIRECTION.md section 5). Hosts CTY-INT-001
 * (change intervention date) and CTY-INT-002 (select treated zone), the two controls that define
 * WHAT is treated and WHEN, before any comparison or counterfactual work happens in later
 * chapters. Reuses the same verified sticky-section + CityStage + useScene pattern Stage 2's intro
 * already established (see docs/ART_DIRECTION.md section 7 item 1 for why this is a separate
 * CityStage mount, not a shared DOM node).
 */
export function Chapter2Treatment() {
  const { scenario } = useScenario();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  useScene(
    SCENE_ID,
    sectionRef,
    ({ gsap: g, reducedMotion }) => {
      const stage = stageRef.current;
      if (!stage) return;

      const treatedLayout = computeCityLayout(24).find((b) => b.zone === scenario.treatedZone);
      const targetX = treatedLayout?.cx ?? VIEWBOX_WIDTH / 2;
      const targetY = treatedLayout?.cy ?? VIEWBOX_HEIGHT / 2;
      const zoomedWidth = VIEWBOX_WIDTH / 1.6;
      const zoomedHeight = VIEWBOX_HEIGHT / 1.6;
      const zoomedViewBox = `${targetX - zoomedWidth / 2} ${targetY - zoomedHeight / 2} ${zoomedWidth} ${zoomedHeight}`;
      const baseViewBox = `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`;

      if (reducedMotion) {
        // Reduced motion: land directly on the framed, zoomed-in treated-zone view, matching the
        // dossier's "reduced motion: instant state changes" rule and Stage 2's own precedent.
        g.set(stage, { attr: { viewBox: zoomedViewBox } });
        return;
      }

      g.set(stage, { attr: { viewBox: baseViewBox } });
      g.timeline({
        scrollTrigger: {
          id: `${SCENE_ID}-pin`,
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      }).fromTo(
        stage,
        { attr: { viewBox: baseViewBox } },
        { attr: { viewBox: zoomedViewBox }, duration: 1, ease: "none" },
        0,
      );
    },
    [scenario.treatedZone],
  );

  return (
    <section
      id="ch2"
      ref={sectionRef}
      className="chapter chapter-treatment"
      data-testid="chapter-2"
      aria-labelledby="ch2-heading"
    >
      <div className="chapter-sticky">
        <div className="chapter-stage-wrap">
          <CityStage ref={stageRef} instanceId="ch2" nZones={24} treatedZone={scenario.treatedZone} />
        </div>
        <div className="chapter-controls">
          <p className="chapter-kicker">02 &mdash; Treatment</p>
          <h2 id="ch2-heading">Define what&rsquo;s treated, and when</h2>
          <p className="chapter-prose">
            Every causal estimate starts with a choice: which zone received the intervention, and on
            which day. Change either below and the city reframes on the real zone you pick.
          </p>
          <InterventionDateControl />
          <TreatedZoneControl />
        </div>
      </div>
    </section>
  );
}

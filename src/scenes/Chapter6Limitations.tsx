import { useRef } from "react";
import { OutcomeControl } from "../controls/OutcomeControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { useScene } from "./useScene";

const SCENE_ID = "ch6";

/**
 * Chapter 6: "limitations" (dossier naming), the "editorial, text-led" archetype
 * (docs/ART_DIRECTION.md section 5: methodology/limitations prose left, outcome control + a small
 * grid right on desktop; grid first then prose on narrow widths, per section 6's own responsive
 * table, kept short per the dossier's own disclaimer-adjacency rule). Hosts CTY-INT-006 (change
 * outcome) AND the dossier's mandatory "explicit high-risk limitation" copy
 * (docs/PROJECT_SPEC.md: "Do not claim causality when identification assumptions fail ... apply
 * scientific disclaimer adjacent to results rather than burying it in the footer") in the same
 * chapter, not a bare control host.
 */
export function Chapter6Limitations() {
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
      id="ch6"
      ref={sectionRef}
      className="chapter chapter-limitations"
      data-testid="chapter-6"
      aria-labelledby="ch6-heading"
    >
      <div className="chapter-sticky">
        <div className="chapter-prose-col">
          <p className="chapter-kicker">06 &mdash; Limitations</p>
          <h2 id="ch6-heading">What this estimate can and cannot tell you</h2>
          <p className="chapter-prose">
            Every number on this page is a difference-in-differences or synthetic-control estimate
            against a fully synthetic panel with a declared treatment, not real-world data (see{" "}
            <code>specifications/DATA_CONTRACT.yaml</code>). Treat it as a demonstration of the
            method, not a finding about any real city.
          </p>
          <p className="chapter-prose" data-testid="identification-assumptions">
            <strong>Identification depends on assumptions this page cannot verify for you:</strong>{" "}
            parallel trends (the treated zone would have followed the same trajectory as its
            controls absent treatment, checked here by the pretrend diagnostic in chapter 5, not
            proven by it), no interference between zones (one zone&rsquo;s treatment doesn&rsquo;t
            change another zone&rsquo;s outcome), and no anticipation effects before the
            intervention date. When the pretrend diagnostic fails, or the donor pool is a poor
            match, the estimate is not evidence of a causal effect, regardless of its size.
          </p>
        </div>
        <div className="chapter-right-col">
          <div className="chapter-stage-wrap chapter-stage-wrap-small">
            <CityStage ref={stageRef} instanceId="ch6" nZones={24} treatedZone={scenario.treatedZone} />
          </div>
          <OutcomeControl />
        </div>
      </div>
    </section>
  );
}

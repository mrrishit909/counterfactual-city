import { useMemo, useRef } from "react";
import { ControlPoolControl } from "../controls/ControlPoolControl";
import { useScenario } from "../engine/ScenarioContext";
import { CityStage } from "./CityStage";
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";
import { Sparkline, type SparklinePoint } from "./Sparkline";
import { useScene } from "./useScene";

const SCENE_ID = "ch3";
const CONTROL_ZONE_COLOR = "#4B84C5"; // --accent-blue
const TREATED_COLOR = "#D65343"; // --accent-red

/**
 * Chapter 3: "matched controls" (dossier naming). Hosts CTY-INT-003 (pick control pool), the
 * control that chooses which non-treated zones serve as the comparison group DiD and synthetic
 * control are fit against. The dossier's own archetype for this chapter is "comparative view"
 * ("three-column comparative, one per candidate control zone, shared axis"), per
 * docs/ART_DIRECTION.md section 5. An independent visual QA review correctly caught that the first
 * build of this chapter (a mirrored/recolored copy of chapter 2's own grid-plus-panel skeleton)
 * did not actually deliver that archetype, just a different color on the same shape. This version
 * adds the real comparative-trajectories strip: up to 3 zones from the current control pool, each
 * plotted against the treated zone's own series on a SHARED y-axis (computed once across all 3, so
 * the comparison is honest, not independently auto-scaled per card), alongside the existing
 * spatial grid tie-in (every selected zone highlighted blue, kept because it is real and useful,
 * not because it was there first).
 */
export function Chapter3MatchedControls() {
  const { scenario, allZones, load } = useScenario();
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

  const comparativeCards = useMemo(() => {
    if (load.status !== "ready") return [];
    const seriesFor = (zone: number): SparklinePoint[] =>
      load.panel.rows
        .filter((r) => r.zone === zone)
        .sort((a, b) => a.day - b.day)
        .map((r) => ({ day: r.day, value: r[scenario.outcome] }));

    const treated = seriesFor(scenario.treatedZone);
    const sampleZones = controlPool.slice(0, 3);
    const cards = sampleZones.map((zone) => ({ zone, series: seriesFor(zone) }));

    // Shared y-domain across treated + all shown candidates: the comparison is only honest if
    // every card is plotted on the same scale, not independently auto-scaled per zone.
    const allValues = [treated, ...cards.map((c) => c.series)].flat().map((p) => p.value);
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);

    return cards.map((c) => ({ ...c, treated, yMin, yMax }));
  }, [load, scenario.treatedZone, scenario.outcome, controlPool]);

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
        <div className="ch3-right-col">
          {comparativeCards.length > 0 && (
            <div className="comparative-strip" data-testid="comparative-strip">
              {comparativeCards.map(({ zone, series, treated, yMin, yMax }) => (
                <div className="comparative-card" key={zone}>
                  <p className="comparative-card-label">Zone {zone}</p>
                  <div className="comparative-card-chart">
                    <Sparkline points={treated} color={TREATED_COLOR} yMin={yMin} yMax={yMax} instanceId={`ch3-treated-${zone}`} />
                    <Sparkline points={series} color={CONTROL_ZONE_COLOR} yMin={yMin} yMax={yMax} instanceId={`ch3-control-${zone}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="chapter-stage-wrap chapter-stage-wrap-small">
            <CityStage ref={stageRef} instanceId="ch3" nZones={24} treatedZone={scenario.treatedZone} zoneColors={zoneColors} />
          </div>
        </div>
      </div>
    </section>
  );
}

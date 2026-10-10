import { forwardRef } from "react";
import { computeCityLayout, computeRoadSegments, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from "./cityLayout";

export interface CityStageProps {
  nZones: number;
  treatedZone: number;
  /** Per-zone color, computed by the caller from a REAL analytical result (never a decorative
   * random value); undefined entries fall back to the neutral zone color. */
  zoneColors?: Record<number, string>;
  /** When set, the treated zone gets a pulsing ring sized by |effect| (also caller-computed from a
   * real result, never decorative). */
  treatedPulseIntensity?: number;
  /** Disambiguates data-testid values when more than one CityStage is mounted at once (one per
   * chapter, see docs/ART_DIRECTION.md section 7 item 1: each chapter gets its own CityStage
   * instance, not a single shared DOM node), e.g. "intro" -> "intro-city-stage",
   * "intro-city-zone-7". Required once a second chapter exists; a real bug (duplicate
   * data-testid/role=img causing Playwright strict-mode violations and an axe-core finding) was
   * found live the moment Chapter 2 was added without this. */
  instanceId: string;
}

/**
 * The persistent city visualization: one continuous SVG scene that every chapter/scene renders
 * into (CASCADIA's own established pattern: "a single persistent SVG stage ... never remounts
 * across an intro sequence and scroll-driven chapters"). A street grid (dossier: "0-3 street plan
 * unfolds") of 24 zone blocks connected by roads, the treated zone marked distinctly, every other
 * zone colorable by a real computed result.
 */
export const CityStage = forwardRef<SVGSVGElement, CityStageProps>(function CityStage(
  { nZones, treatedZone, zoneColors, treatedPulseIntensity, instanceId },
  ref,
) {
  const blocks = computeCityLayout(nZones);
  const roads = computeRoadSegments(nZones);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      className="city-stage"
      role="img"
      aria-label={`City map, ${nZones} zones, zone ${treatedZone} is the treated zone`}
      data-testid={`${instanceId}-city-stage`}
    >
      <g className="city-roads" aria-hidden="true">
        {roads.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} className="road" />
        ))}
      </g>
      <g className="city-blocks">
        {blocks.map((b) => {
          const isTreated = b.zone === treatedZone;
          const fill = zoneColors?.[b.zone];
          return (
            <g key={b.zone} data-testid={`${instanceId}-city-zone-${b.zone}`} data-treated={isTreated}>
              {isTreated && treatedPulseIntensity !== undefined && (
                <circle
                  className="treated-pulse"
                  cx={b.cx}
                  cy={b.cy}
                  r={b.width * 0.6}
                  style={{ opacity: Math.min(0.6, Math.abs(treatedPulseIntensity)), fill: fill ?? undefined }}
                />
              )}
              <rect
                x={b.x}
                y={b.y}
                width={b.width}
                height={b.height}
                rx={4}
                className={isTreated ? "zone-block zone-block-treated" : "zone-block"}
                // An independent review caught the stroke/pulse ring staying a hardcoded red
                // (via CSS var(--accent-red)) regardless of the real effect's sign, so a positive
                // (blue-fill) result still got a red halo, muddying the two-color encoding. Both
                // fill AND stroke now come from the same computed color (resultVisualEncoding.ts).
                style={fill ? { fill, stroke: isTreated ? fill : undefined } : undefined}
              />
              <text x={b.cx} y={b.cy} textAnchor="middle" dominantBaseline="middle" className="zone-label">
                {b.zone}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
});

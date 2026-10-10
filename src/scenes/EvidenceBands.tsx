// The dossier's own literal phrase for CTY-INT-005 is "launch placebo > null distribution >
// EVIDENCE BANDS" (docs/ART_DIRECTION.md section 5's "focused inspector" archetype). Before this
// component, the chapter only stated the rank and p-value as text; the full null distribution
// (PlaceboResult.placeboEffects, already computed by runPlaceboTest, src/engine/estimators.ts, but
// never rendered) is the real visual this chapter was missing, the same pattern as chapter 4's own
// trajectory chart: data the estimator already produces, sitting unused.
const WIDTH = 440;
const HEIGHT = 90;
const PAD = 28;
const DOT_R = 4;
const TREATED_DOT_R = 7;

export interface EvidenceBandsProps {
  placeboEffects: Record<number, number>;
  realEffect: number;
  treatedZone: number;
  instanceId: string;
}

export function EvidenceBands({ placeboEffects, realEffect, treatedZone, instanceId }: EvidenceBandsProps) {
  const entries = Object.entries(placeboEffects).map(([zone, effect]) => ({ zone: Number(zone), effect }));
  if (entries.length === 0) return null;

  const allValues = [...entries.map((e) => e.effect), realEffect];
  const vMin = Math.min(...allValues, 0);
  const vMax = Math.max(...allValues, 0);
  const pad = (vMax - vMin) * 0.12 || 1;
  const lo = vMin - pad;
  const hi = vMax + pad;
  const xScale = (v: number) => PAD + ((v - lo) / (hi - lo)) * (WIDTH - 2 * PAD);
  const zeroX = xScale(0);

  return (
    <svg
      className="evidence-bands"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Null distribution of placebo effects, real treated-zone effect ${realEffect.toFixed(1)}, rank among ${entries.length + 1} units`}
      data-testid={`${instanceId}-evidence-bands`}
    >
      <line x1={zeroX} x2={zeroX} y1={14} y2={HEIGHT - 14} className="evidence-bands-zero-line" />
      <text x={zeroX} y={10} textAnchor="middle" className="evidence-bands-zero-label">
        no effect
      </text>
      <line x1={PAD} x2={WIDTH - PAD} y1={HEIGHT / 2} y2={HEIGHT / 2} className="evidence-bands-axis" />
      {entries.map(({ zone, effect }) => (
        <circle
          key={zone}
          cx={xScale(effect)}
          cy={HEIGHT / 2}
          r={DOT_R}
          className="evidence-bands-placebo-dot"
          data-testid={`${instanceId}-evidence-dot-${zone}`}
        />
      ))}
      <circle
        cx={xScale(realEffect)}
        cy={HEIGHT / 2}
        r={TREATED_DOT_R}
        className="evidence-bands-treated-dot"
        data-testid={`${instanceId}-evidence-dot-treated-${treatedZone}`}
      />
      <text x={xScale(realEffect)} y={HEIGHT - 4} textAnchor="middle" className="evidence-bands-treated-label">
        zone {treatedZone} (real)
      </text>
    </svg>
  );
}

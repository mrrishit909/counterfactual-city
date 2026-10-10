// The literal flagship chart the dossier describes ("two urban timelines diverge as estimator
// assumptions are manipulated"): the treated zone's REAL observed outcome series next to the
// synthetic-control's reconstructed series for the same days, both derived from real panel data
// and the real syntheticControl() estimate (src/engine/estimators.ts), never placeholder/decorative
// points. A second self-review found the chapter was missing this entirely: scroll-driven stage
// divergence alone doesn't show WHAT diverges (no time axis, no estimator-driven redraw), which is
// what the dossier's own "as estimator assumptions are manipulated" phrase requires.
//
// No charting library: two polylines, a day axis, and a few text labels is well within "write it
// by hand" per the project's own dependency-minimalism convention (see package.json: no chart lib
// already installed).
const WIDTH = 480;
const HEIGHT = 220;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;

export interface TrajectoryPoint {
  day: number;
  value: number;
}

export interface TrajectoryChartProps {
  observed: TrajectoryPoint[];
  synthetic: TrajectoryPoint[];
  interventionDay: number;
  unit: string;
  observedColor: string;
  syntheticColor: string;
  instanceId: string;
}

function toPath(points: TrajectoryPoint[], xScale: (d: number) => number, yScale: (v: number) => number): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.day).toFixed(1)},${yScale(p.value).toFixed(1)}`).join(" ");
}

export function TrajectoryChart({
  observed,
  synthetic,
  interventionDay,
  unit,
  observedColor,
  syntheticColor,
  instanceId,
}: TrajectoryChartProps) {
  if (observed.length === 0 || synthetic.length === 0) return null;

  const allDays = observed.map((p) => p.day);
  const allValues = [...observed, ...synthetic].map((p) => p.value);
  const dayMin = Math.min(...allDays);
  const dayMax = Math.max(...allDays);
  const valueMin = Math.min(...allValues);
  const valueMax = Math.max(...allValues);
  const valuePad = (valueMax - valueMin) * 0.1 || 1;

  const xScale = (d: number) =>
    dayMax === dayMin ? PAD_LEFT : PAD_LEFT + ((d - dayMin) / (dayMax - dayMin)) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const yScale = (v: number) => {
    const lo = valueMin - valuePad;
    const hi = valueMax + valuePad;
    return hi === lo ? HEIGHT - PAD_BOTTOM : HEIGHT - PAD_BOTTOM - ((v - lo) / (hi - lo)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  };

  const interventionX = xScale(interventionDay);

  return (
    <svg
      className="trajectory-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Observed versus synthetic ${unit} trajectory, intervention at day ${interventionDay}`}
      data-testid={`${instanceId}-trajectory-chart`}
    >
      <line
        x1={interventionX}
        x2={interventionX}
        y1={PAD_TOP}
        y2={HEIGHT - PAD_BOTTOM}
        className="trajectory-intervention-line"
      />
      <text x={interventionX + 4} y={PAD_TOP + 10} className="trajectory-intervention-label">
        intervention
      </text>
      <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} className="trajectory-axis" />
      <text x={PAD_LEFT} y={HEIGHT - 6} className="trajectory-axis-label">
        day {dayMin}
      </text>
      <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} textAnchor="end" className="trajectory-axis-label">
        day {dayMax}
      </text>
      <text x={PAD_LEFT - 6} y={PAD_TOP + 8} textAnchor="end" className="trajectory-axis-label">
        {valueMax.toFixed(0)}
      </text>
      <text x={PAD_LEFT - 6} y={HEIGHT - PAD_BOTTOM} textAnchor="end" className="trajectory-axis-label">
        {valueMin.toFixed(0)}
      </text>
      <path d={toPath(synthetic, xScale, yScale)} fill="none" stroke={syntheticColor} strokeWidth={2} strokeDasharray="4 3" data-testid={`${instanceId}-trajectory-synthetic`} />
      <path d={toPath(observed, xScale, yScale)} fill="none" stroke={observedColor} strokeWidth={2} data-testid={`${instanceId}-trajectory-observed`} />
    </svg>
  );
}

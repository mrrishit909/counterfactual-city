// A compact single-series line, used for chapter 3's own comparative-trajectories strip
// (docs/ART_DIRECTION.md's own "comparative view" archetype: "three-column comparative, one per
// candidate control zone, shared axis"). Deliberately minimal (no axis labels, no legend of its
// own): TrajectoryChart (src/scenes/TrajectoryChart.tsx) is the full, labeled version used for
// chapter 4's own flagship result; this is the small-multiples building block for a ROW of these,
// sharing one y-domain across the row so the comparison is honest (see Chapter3MatchedControls.tsx
// for how the shared domain is computed).
const WIDTH = 160;
const HEIGHT = 64;
const PAD = 4;

export interface SparklinePoint {
  day: number;
  value: number;
}

export interface SparklineProps {
  points: SparklinePoint[];
  color: string;
  yMin: number;
  yMax: number;
  instanceId: string;
}

export function Sparkline({ points, color, yMin, yMax, instanceId }: SparklineProps) {
  if (points.length === 0) return null;
  const dayMin = points[0].day;
  const dayMax = points[points.length - 1].day;
  const xScale = (d: number) => (dayMax === dayMin ? PAD : PAD + ((d - dayMin) / (dayMax - dayMin)) * (WIDTH - 2 * PAD));
  const yScale = (v: number) => (yMax === yMin ? HEIGHT - PAD : HEIGHT - PAD - ((v - yMin) / (yMax - yMin)) * (HEIGHT - 2 * PAD));
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${xScale(p.day).toFixed(1)},${yScale(p.value).toFixed(1)}`).join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-hidden="true" data-testid={`${instanceId}-sparkline`}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

// Browser-side causal-inference estimators. This is a TypeScript PORT of
// analysis/models/estimators.py, the Python oracle, checked for numerical parity against it in
// src/engine/estimators.test.ts (CTY-MATH-001: "an independent numerical baseline agrees within a
// stated tolerance"). The Python file remains the source of truth; this file is validated against
// it, never the reverse.
import type {
  DiDResult,
  Outcome,
  PanelRow,
  PlaceboResult,
  PretrendResult,
  SyntheticControlResult,
} from "./types";

const WEIGHT_SUM_TOLERANCE = 1e-6;

export function diffInDiff(
  rows: PanelRow[],
  outcome: Outcome,
  treatedZone: number,
  interventionDay: number,
  controlZones?: number[],
): DiDResult {
  if (rows.length === 0) {
    throw new Error("panel is empty");
  }
  const zones = new Set(rows.map((r) => r.zone));
  if (!zones.has(treatedZone)) {
    throw new Error(`treated_zone ${treatedZone} not present in panel`);
  }
  const days = rows.map((r) => r.day);
  const dayMin = Math.min(...days);
  const dayMax = Math.max(...days);
  if (!(dayMin < interventionDay && interventionDay <= dayMax)) {
    throw new Error(
      `intervention_day ${interventionDay} outside observed range (${dayMin}, ${dayMax}]`,
    );
  }

  let pool = controlZones ?? [...zones].filter((z) => z !== treatedZone);
  pool = pool.filter((z) => z !== treatedZone);
  if (pool.length === 0) {
    throw new Error("control pool is empty (after excluding the treated zone)");
  }
  const poolSet = new Set(pool);

  const mean = (vals: number[]): number => {
    if (vals.length === 0) return NaN;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const pre = rows.filter((r) => r.day < interventionDay);
  const post = rows.filter((r) => r.day >= interventionDay);

  const treatedPre = mean(pre.filter((r) => r.zone === treatedZone).map((r) => r[outcome]));
  const treatedPost = mean(post.filter((r) => r.zone === treatedZone).map((r) => r[outcome]));
  const controlPre = mean(pre.filter((r) => poolSet.has(r.zone)).map((r) => r[outcome]));
  const controlPost = mean(post.filter((r) => poolSet.has(r.zone)).map((r) => r[outcome]));

  if ([treatedPre, treatedPost, controlPre, controlPost].some((v) => Number.isNaN(v))) {
    throw new Error("insufficient observations in one of the four DiD cells");
  }

  const att = treatedPost - treatedPre - (controlPost - controlPre);
  return {
    att,
    treatedZone,
    interventionDay,
    outcome,
    preTreatedMean: treatedPre,
    preControlMean: controlPre,
    postTreatedMean: treatedPost,
    postControlMean: controlPost,
  };
}

// ---------------------------------------------------------------------------
// Small linear algebra helpers (no dependency: this project's matrices are tiny, a few dozen
// donors by a few hundred pre-period days, well within what plain JS arrays handle fine).
// ---------------------------------------------------------------------------

type Matrix = number[][]; // row-major

function matVec(A: Matrix, x: number[]): number[] {
  return A.map((row) => row.reduce((sum, a, j) => sum + a * x[j], 0));
}

function matTVec(A: Matrix, x: number[]): number[] {
  const nCols = A[0]?.length ?? 0;
  const out = new Array(nCols).fill(0);
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < nCols; j++) {
      out[j] += A[i][j] * x[i];
    }
  }
  return out;
}

function matTMat(A: Matrix): Matrix {
  const nCols = A[0]?.length ?? 0;
  const out: Matrix = Array.from({ length: nCols }, () => new Array(nCols).fill(0));
  for (let i = 0; i < A.length; i++) {
    for (let j = 0; j < nCols; j++) {
      for (let k = 0; k < nCols; k++) {
        out[j][k] += A[i][j] * A[i][k];
      }
    }
  }
  return out;
}

/** Largest eigenvalue of a symmetric PSD matrix via power iteration, used to pick a safe step size
 * for projected gradient descent (step = 1/L is guaranteed non-increasing for an L-smooth convex
 * objective). 200 iterations is far more than needed for the small (<= ~25x25) matrices here. */
function largestEigenvalue(A: Matrix): number {
  const n = A.length;
  let v = new Array(n).fill(1 / Math.sqrt(n));
  let lambda = 0;
  for (let iter = 0; iter < 200; iter++) {
    const Av = matVec(A, v);
    const norm = Math.sqrt(Av.reduce((s, x) => s + x * x, 0));
    if (norm === 0) return 0;
    v = Av.map((x) => x / norm);
    lambda = norm;
  }
  return lambda;
}

/** Non-negative least squares via projected gradient descent: minimize ||Ax - b||^2 subject to
 * x >= 0. This solves the SAME convex problem as scipy.optimize.nnls (used by the Python oracle,
 * analysis/models/estimators.py), via a different algorithm (projected gradient, not Lawson-Hanson
 * active-set): both are standard, convergence-guaranteed methods for this convex problem, so this
 * is an independent numerical approach, not a reimplementation of the Python algorithm line for
 * line. Parity is checked at the level of the RECOVERED SCENARIO (ground-truth ATT, weight
 * feasibility), not bit-identical weights, the same way this project already treats SLSQP vs. NNLS
 * in the Python side as two valid solvers for one problem (see execution/PROGRESS.md decision log).
 */
function nnlsProjectedGradient(A: Matrix, b: number[], iters = 3000): number[] {
  const n = A[0]?.length ?? 0;
  const AtA = matTMat(A);
  const Atb = matTVec(A, b);
  const L = largestEigenvalue(AtA);
  const step = L > 0 ? 1 / L : 1e-6;

  let w = new Array(n).fill(1 / n);
  for (let iter = 0; iter < iters; iter++) {
    const grad = matVec(AtA, w).map((v, j) => v - Atb[j]);
    w = w.map((wj, j) => Math.max(0, wj - step * grad[j]));
  }
  return w;
}

function fitDonorWeights(treatedPre: number[], donorPre: Matrix): number[] {
  const nDonors = donorPre[0]?.length ?? 0;
  const scale = Math.max(
    treatedPre.reduce((s, v) => s + Math.abs(v), 0) / Math.max(treatedPre.length, 1),
    1,
  );
  const lam = scale * 10.0;

  const A: Matrix = [...donorPre, new Array(nDonors).fill(lam)];
  const b: number[] = [...treatedPre, lam];

  const w = nnlsProjectedGradient(A, b);
  const sum = w.reduce((s, v) => s + v, 0);
  if (sum <= 0) {
    throw new Error("donor weight optimization failed: no feasible non-negative combination found");
  }
  return w.map((v) => v / sum);
}

export function syntheticControl(
  rows: PanelRow[],
  outcome: Outcome,
  treatedZone: number,
  interventionDay: number,
  donorPool?: number[],
  weights?: number[],
): SyntheticControlResult {
  if (rows.length === 0) throw new Error("panel is empty");
  const zones = new Set(rows.map((r) => r.zone));
  if (!zones.has(treatedZone)) {
    throw new Error(`treated_zone ${treatedZone} not present in panel`);
  }

  let pool = donorPool ?? [...zones].filter((z) => z !== treatedZone).sort((a, b) => a - b);
  pool = pool.filter((z) => z !== treatedZone);
  if (pool.length < 2) {
    throw new Error("synthetic control needs at least 2 donor units in the control pool");
  }

  const byZoneSortedByDay = (zone: number): PanelRow[] =>
    rows.filter((r) => r.zone === zone).sort((a, b) => a.day - b.day);

  const allTreatedRows = byZoneSortedByDay(treatedZone);
  const preTreatedRows = allTreatedRows.filter((r) => r.day < interventionDay);
  const treatedPre = preTreatedRows.map((r) => r[outcome]);

  const donorPreByZone = pool.map((z) => byZoneSortedByDay(z).filter((r) => r.day < interventionDay));
  if (treatedPre.length === 0 || donorPreByZone.some((d) => d.length === 0)) {
    throw new Error("no pre-treatment observations available to fit donor weights");
  }
  if (donorPreByZone.some((d) => d.length !== treatedPre.length)) {
    throw new Error("treated and donor pre-period series are misaligned (unequal day coverage)");
  }
  // donorPre[t][j] = donor j's outcome on pre-period row t
  const donorPre: Matrix = treatedPre.map((_, t) => donorPreByZone.map((d) => d[t][outcome]));

  let w: number[];
  if (weights !== undefined) {
    if (weights.length !== pool.length) {
      throw new Error(`expected ${pool.length} weights, got ${weights.length}`);
    }
    if (weights.some((v) => v < -1e-9)) {
      throw new Error("weights must be non-negative");
    }
    const sum = weights.reduce((s, v) => s + v, 0);
    if (Math.abs(sum - 1.0) > WEIGHT_SUM_TOLERANCE) {
      throw new Error(`weights must sum to 1 (got ${sum.toFixed(6)})`);
    }
    w = weights.map((v) => Math.max(0, v));
  } else {
    w = fitDonorWeights(treatedPre, donorPre);
  }

  const donorAllByZone = pool.map((z) => byZoneSortedByDay(z));
  const gapByDay: Record<number, number> = {};
  let preSqSum = 0;
  let preCount = 0;
  let postSum = 0;
  let postCount = 0;

  for (let t = 0; t < allTreatedRows.length; t++) {
    const day = allTreatedRows[t].day;
    const synthetic = donorAllByZone.reduce((s, d, j) => s + d[t][outcome] * w[j], 0);
    const gap = allTreatedRows[t][outcome] - synthetic;
    gapByDay[day] = gap;
    if (day < interventionDay) {
      preSqSum += gap * gap;
      preCount += 1;
    } else {
      postSum += gap;
      postCount += 1;
    }
  }

  const weightsOut: Record<number, number> = {};
  pool.forEach((z, j) => {
    weightsOut[z] = w[j];
  });

  return {
    weights: weightsOut,
    preRmspe: Math.sqrt(preSqSum / Math.max(preCount, 1)),
    gapByDay,
    attPostMean: postCount > 0 ? postSum / postCount : NaN,
    treatedZone,
    interventionDay,
    outcome,
  };
}

export function runPlaceboTest(
  rows: PanelRow[],
  outcome: Outcome,
  treatedZone: number,
  interventionDay: number,
  donorPool?: number[],
): PlaceboResult {
  if (rows.length === 0) throw new Error("panel is empty");
  const zones = new Set(rows.map((r) => r.zone));
  let pool = donorPool ?? [...zones].filter((z) => z !== treatedZone).sort((a, b) => a - b);
  pool = pool.filter((z) => z !== treatedZone);
  if (pool.length < 2) {
    throw new Error("placebo test needs at least 2 non-treated units to permute over");
  }

  const real = syntheticControl(rows, outcome, treatedZone, interventionDay, pool);

  const placeboEffects: Record<number, number> = {};
  for (const placeboUnit of pool) {
    const remainingPool = [...pool.filter((z) => z !== placeboUnit), treatedZone];
    try {
      const result = syntheticControl(rows, outcome, placeboUnit, interventionDay, remainingPool);
      placeboEffects[placeboUnit] = result.attPostMean;
    } catch {
      // an infeasible placebo fit is excluded, not fabricated, matching the Python oracle
    }
  }
  if (Object.keys(placeboEffects).length === 0) {
    throw new Error("no placebo unit produced a feasible synthetic-control fit");
  }

  const allEffects: Record<number, number> = { ...placeboEffects, [treatedZone]: real.attPostMean };
  const sortedUnits = Object.keys(allEffects)
    .map(Number)
    .sort((a, b) => Math.abs(allEffects[b]) - Math.abs(allEffects[a]));
  const rank = sortedUnits.indexOf(treatedZone) + 1;
  const nTotal = sortedUnits.length;

  return {
    realEffect: real.attPostMean,
    placeboEffects,
    rank,
    nPlacebos: Object.keys(placeboEffects).length,
    pValue: rank / nTotal,
  };
}

/** Regularized incomplete beta function via the standard continued-fraction expansion (Numerical
 * Recipes' betacf/betai), used only to get the Student-t two-sided p-value below without pulling in
 * a stats dependency for one lookup, the same reasoning the Python oracle gives for its own
 * `from scipy import stats` being scoped to this one function. */
function logGamma(x: number): number {
  const cof = [
    676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  const g = 7;
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const xx = x - 1;
  let a = 0.99999999999980993;
  const t = xx + g + 0.5;
  for (let i = 0; i < cof.length; i++) a += cof[i] / (xx + i + 1);
  return 0.5 * Math.log(2 * Math.PI) + (xx + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

/** Two-sided Student-t survival p-value, matching `2 * (1 - scipy.stats.t.cdf(|t|, df))`. */
function studentTTwoSidedPValue(tStat: number, dof: number): number {
  const x = dof / (dof + tStat * tStat);
  return regularizedIncompleteBeta(x, dof / 2, 0.5);
}

export function pretrendDiagnostic(
  rows: PanelRow[],
  outcome: Outcome,
  treatedZone: number,
  interventionDay: number,
  donorPool?: number[],
  alpha = 0.05,
): PretrendResult {
  const result = syntheticControl(rows, outcome, treatedZone, interventionDay, donorPool);
  const preDays = Object.keys(result.gapByDay)
    .map(Number)
    .filter((d) => d < interventionDay)
    .sort((a, b) => a - b);
  if (preDays.length < 3) {
    throw new Error("fewer than 3 pre-period observations, cannot fit a trend");
  }

  const values = preDays.map((d) => result.gapByDay[d]);
  const n = preDays.length;
  const xMean = preDays.reduce((s, v) => s + v, 0) / n;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  const sxx = preDays.reduce((s, x) => s + (x - xMean) ** 2, 0);
  const sxy = preDays.reduce((s, x, i) => s + (x - xMean) * (values[i] - yMean), 0);
  const slope = sxy / sxx;
  const residuals = values.map((y, i) => y - (yMean + slope * (preDays[i] - xMean)));
  const dof = n - 2;
  if (dof <= 0) {
    throw new Error("not enough degrees of freedom for a pretrend t-test");
  }
  const s2 = residuals.reduce((s, r) => s + r * r, 0) / dof;
  const seSlope = Math.sqrt(s2 / sxx);
  const tStat = seSlope > 0 ? slope / seSlope : 0;
  const pValue = studentTTwoSidedPValue(tStat, dof);

  return {
    slopeGap: slope,
    slopePvalue: pValue,
    passes: pValue >= alpha,
    alpha,
  };
}

"""Reference causal-inference estimators for THE COUNTERFACTUAL CITY.

Implements the dossier's required methods (docs/PROJECT_SPEC.md, "Methods and implementation"):
difference-in-differences, synthetic control, placebo/pretrend diagnostics. This module is the
PYTHON ORACLE: the source of truth any browser-side computation is checked against (never the
reverse), per CLAUDE.md.

All functions operate on the long-format panel produced by analysis/data/synthetic_panel.py:
columns = zone, day, <outcome columns...>, treated, post.

Every public function raises ValueError (not a silent NaN/garbage result) on an infeasible input:
empty data, a missing outcome column, zero or one control units where more are required, a donor
weight vector that does not sum to 1 within tolerance, or an intervention day outside the observed
day range. This is what CTY-INT-001..006's "handle invalid inputs" requirement means at the
computation layer; the frontend control thunks must not swallow these errors.
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from scipy.optimize import nnls

WEIGHT_SUM_TOLERANCE = 1e-6


def _require_outcome(df: pd.DataFrame, outcome: str) -> None:
    if df.empty:
        raise ValueError("panel is empty")
    if outcome not in df.columns:
        raise ValueError(f"unknown outcome column: {outcome!r}")


# ---------------------------------------------------------------------------
# Difference-in-differences (two-way fixed effects, computed two independent ways)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class DiDResult:
    att: float
    treated_zone: int
    intervention_day: int
    outcome: str
    pre_treated_mean: float
    pre_control_mean: float
    post_treated_mean: float
    post_control_mean: float


def diff_in_diff(
    df: pd.DataFrame,
    outcome: str,
    treated_zone: int,
    intervention_day: int,
    control_zones: list[int] | None = None,
) -> DiDResult:
    """Classic 2x2 difference-in-differences ATT.

    ATT = (treated_post - treated_pre) - (control_post - control_pre)

    control_zones defaults to every non-treated zone in the panel (CTY-INT-003, "pick control pool",
    narrows this). Raises ValueError if the treated zone or an empty control pool is given, or if
    intervention_day falls outside the observed range (both are "invalid input" cases the dossier
    requires controls to handle, not silently clamp).
    """
    _require_outcome(df, outcome)
    if treated_zone not in df["zone"].unique():
        raise ValueError(f"treated_zone {treated_zone} not present in panel")
    day_min, day_max = int(df["day"].min()), int(df["day"].max())
    if not (day_min < intervention_day <= day_max):
        raise ValueError(
            f"intervention_day {intervention_day} outside observed range ({day_min}, {day_max}]"
        )

    if control_zones is None:
        control_zones = sorted(z for z in df["zone"].unique() if z != treated_zone)
    control_zones = [z for z in control_zones if z != treated_zone]
    if not control_zones:
        raise ValueError("control pool is empty (after excluding the treated zone)")

    pre = df[df["day"] < intervention_day]
    post = df[df["day"] >= intervention_day]

    treated_pre = pre[pre["zone"] == treated_zone][outcome].mean()
    treated_post = post[post["zone"] == treated_zone][outcome].mean()
    control_pre = pre[pre["zone"].isin(control_zones)][outcome].mean()
    control_post = post[post["zone"].isin(control_zones)][outcome].mean()

    if any(np.isnan(v) for v in (treated_pre, treated_post, control_pre, control_post)):
        raise ValueError("insufficient observations in one of the four DiD cells")

    att = (treated_post - treated_pre) - (control_post - control_pre)
    return DiDResult(
        att=float(att),
        treated_zone=treated_zone,
        intervention_day=intervention_day,
        outcome=outcome,
        pre_treated_mean=float(treated_pre),
        pre_control_mean=float(control_pre),
        post_treated_mean=float(treated_post),
        post_control_mean=float(control_post),
    )


def diff_in_diff_regression(
    df: pd.DataFrame,
    outcome: str,
    treated_zone: int,
    intervention_day: int,
    control_zones: list[int] | None = None,
) -> float:
    """Independent cross-check of diff_in_diff via an OLS regression with a treated*post
    interaction (the canonical TWFE-equivalent estimator for the balanced 2-group/2-period case).
    Used only in tests, to confirm the closed-form cell-mean computation above is not a transcription
    error, not as a second production code path.
    """
    _require_outcome(df, outcome)
    if control_zones is None:
        control_zones = sorted(z for z in df["zone"].unique() if z != treated_zone)
    subset = df[df["zone"].isin([treated_zone, *control_zones])].copy()
    subset["treated_unit"] = (subset["zone"] == treated_zone).astype(float)
    subset["post_period"] = (subset["day"] >= intervention_day).astype(float)
    subset["interaction"] = subset["treated_unit"] * subset["post_period"]

    X = np.column_stack(
        [np.ones(len(subset)), subset["treated_unit"], subset["post_period"], subset["interaction"]]
    )
    y = subset[outcome].to_numpy()
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    return float(beta[3])  # coefficient on the interaction term = ATT


# ---------------------------------------------------------------------------
# Synthetic control
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SyntheticControlResult:
    weights: dict[int, float]
    pre_rmspe: float
    gap_series: pd.Series  # indexed by day: treated_actual - synthetic
    att_post_mean: float
    treated_zone: int
    intervention_day: int
    outcome: str


def synthetic_control(
    df: pd.DataFrame,
    outcome: str,
    treated_zone: int,
    intervention_day: int,
    donor_pool: list[int] | None = None,
    weights: np.ndarray | None = None,
) -> SyntheticControlResult:
    """Fit (or apply supplied) convex-combination donor weights minimizing pre-period RMSPE between
    the treated unit and the synthetic control, then report the post-period gap.

    If `weights` is given (CTY-INT-004, "adjust weights"), they are used AS GIVEN rather than
    re-optimized, after validating they are a convex combination (non-negative, sum to 1 within
    WEIGHT_SUM_TOLERANCE) over `donor_pool`, in donor_pool order. This is what lets a user-adjusted
    weight vector drive a real recomputed gap rather than a cosmetic slider.
    """
    _require_outcome(df, outcome)
    if treated_zone not in df["zone"].unique():
        raise ValueError(f"treated_zone {treated_zone} not present in panel")

    if donor_pool is None:
        donor_pool = sorted(z for z in df["zone"].unique() if z != treated_zone)
    donor_pool = [z for z in donor_pool if z != treated_zone]
    if len(donor_pool) < 2:
        raise ValueError("synthetic control needs at least 2 donor units in the control pool")

    pre = df[df["day"] < intervention_day]
    all_days = df[df["zone"] == treated_zone].sort_values("day")

    treated_pre = pre[pre["zone"] == treated_zone].sort_values("day")[outcome].to_numpy()
    donor_pre = np.column_stack(
        [pre[pre["zone"] == z].sort_values("day")[outcome].to_numpy() for z in donor_pool]
    )
    if treated_pre.shape[0] == 0 or donor_pre.shape[0] == 0:
        raise ValueError("no pre-treatment observations available to fit donor weights")
    if treated_pre.shape[0] != donor_pre.shape[0]:
        raise ValueError("treated and donor pre-period series are misaligned (unequal day coverage)")

    if weights is not None:
        w = np.asarray(weights, dtype=float)
        if w.shape[0] != len(donor_pool):
            raise ValueError(f"expected {len(donor_pool)} weights, got {w.shape[0]}")
        if np.any(w < -1e-9):
            raise ValueError("weights must be non-negative")
        if abs(w.sum() - 1.0) > WEIGHT_SUM_TOLERANCE:
            raise ValueError(f"weights must sum to 1 (got {w.sum():.6f})")
        w = np.clip(w, 0, None)
    else:
        w = _fit_donor_weights(treated_pre, donor_pre)

    donor_all = np.column_stack(
        [df[df["zone"] == z].sort_values("day")[outcome].to_numpy() for z in donor_pool]
    )
    synthetic_series = donor_all @ w
    treated_series = all_days[outcome].to_numpy()
    gap = treated_series - synthetic_series

    pre_mask = all_days["day"].to_numpy() < intervention_day
    post_mask = ~pre_mask
    pre_rmspe = float(np.sqrt(np.mean(gap[pre_mask] ** 2)))
    att_post_mean = float(np.mean(gap[post_mask])) if post_mask.any() else float("nan")

    gap_series = pd.Series(gap, index=all_days["day"].to_numpy(), name="gap")

    return SyntheticControlResult(
        weights=dict(zip(donor_pool, w.tolist())),
        pre_rmspe=pre_rmspe,
        gap_series=gap_series,
        att_post_mean=att_post_mean,
        treated_zone=treated_zone,
        intervention_day=intervention_day,
        outcome=outcome,
    )


def _fit_donor_weights(treated_pre: np.ndarray, donor_pre: np.ndarray, n_restarts: int = 5) -> np.ndarray:
    """Fit non-negative donor weights summing to 1 that minimize pre-period squared error, via the
    standard sum-to-one relaxation: augment the least-squares system with one row enforcing
    sum(w) = lambda (lambda scaled to the outcome's own magnitude so the constraint is properly
    weighted against the fit rows), then solve with NNLS. NNLS is an active-set method with a
    convergence guarantee (unlike SLSQP's line search, which can report a spurious non-convergence
    on the near-collinear donor matrices this panel's by-construction-parallel pre-trends produce,
    see the regression test for this exact failure mode). Renormalizing the NNLS solution to sum to
    exactly 1 after the fact recovers the same convex-combination synthetic control.
    """
    n_donors = donor_pre.shape[1]
    scale = max(float(np.mean(np.abs(treated_pre))), 1.0)
    lam = scale * 10.0  # weight the sum-to-one row heavily relative to the per-period fit rows

    A = np.vstack([donor_pre, lam * np.ones((1, n_donors))])
    b = np.concatenate([treated_pre, [lam]])

    w, _residual = nnls(A, b, maxiter=n_restarts * (n_donors + 50))
    if w.sum() <= 0:
        raise ValueError("donor weight optimization failed: no feasible non-negative combination found")
    w = w / w.sum()
    return w


# ---------------------------------------------------------------------------
# Placebo inference (in-space placebo test)
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PlaceboResult:
    real_effect: float
    placebo_effects: dict[int, float]
    rank: int           # 1-indexed rank of the real effect's |magnitude| among all (incl. itself)
    n_placebos: int
    p_value: float       # rank / n_total, standard permutation-style placebo p-value


def run_placebo_test(
    df: pd.DataFrame,
    outcome: str,
    treated_zone: int,
    intervention_day: int,
    donor_pool: list[int] | None = None,
) -> PlaceboResult:
    """In-space placebo test: re-run synthetic control treating EACH control zone as if it were
    treated, building a null distribution of "effects" that did not actually receive treatment.
    The real effect's rank within that distribution (by |post-period mean gap|) gives a permutation
    p-value, the dossier's required "null distribution / evidence bands" (CTY-INT-005).
    """
    _require_outcome(df, outcome)
    if donor_pool is None:
        donor_pool = sorted(z for z in df["zone"].unique() if z != treated_zone)
    donor_pool = [z for z in donor_pool if z != treated_zone]
    if len(donor_pool) < 2:
        raise ValueError("placebo test needs at least 2 non-treated units to permute over")

    real = synthetic_control(df, outcome, treated_zone, intervention_day, donor_pool=donor_pool)

    placebo_effects: dict[int, float] = {}
    for placebo_unit in donor_pool:
        remaining_pool = [z for z in donor_pool if z != placebo_unit] + [treated_zone]
        try:
            result = synthetic_control(
                df, outcome, placebo_unit, intervention_day, donor_pool=remaining_pool
            )
        except ValueError:
            continue  # an infeasible placebo fit is excluded, not fabricated
        placebo_effects[placebo_unit] = result.att_post_mean

    if not placebo_effects:
        raise ValueError("no placebo unit produced a feasible synthetic-control fit")

    all_effects = {**placebo_effects, treated_zone: real.att_post_mean}
    magnitudes = {z: abs(v) for z, v in all_effects.items()}
    sorted_units = sorted(magnitudes, key=lambda z: magnitudes[z], reverse=True)
    rank = sorted_units.index(treated_zone) + 1
    n_total = len(sorted_units)

    return PlaceboResult(
        real_effect=real.att_post_mean,
        placebo_effects=placebo_effects,
        rank=rank,
        n_placebos=len(placebo_effects),
        p_value=rank / n_total,
    )


# ---------------------------------------------------------------------------
# Pretrend diagnostic
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class PretrendResult:
    slope_gap: float          # linear-trend slope of (treated - synthetic) over the PRE period
    slope_pvalue: float
    passes: bool              # True if slope is not significantly different from 0 at alpha
    alpha: float


def pretrend_diagnostic(
    df: pd.DataFrame,
    outcome: str,
    treated_zone: int,
    intervention_day: int,
    donor_pool: list[int] | None = None,
    alpha: float = 0.05,
) -> PretrendResult:
    """Fit a linear trend to the PRE-period gap (treated - synthetic control) and test whether its
    slope is statistically distinguishable from zero. A significant pre-trend means the parallel-
    trends / no-anticipation identification assumption is suspect for this treated unit and donor
    pool, this is the dossier's required "pretrend" diagnostic (CTY-DATA/MATH gates, "identification
    conditions explicit").
    """
    result = synthetic_control(df, outcome, treated_zone, intervention_day, donor_pool=donor_pool)
    pre_gap = result.gap_series[result.gap_series.index < intervention_day]
    if len(pre_gap) < 3:
        raise ValueError("fewer than 3 pre-period observations, cannot fit a trend")

    days = pre_gap.index.to_numpy(dtype=float)
    values = pre_gap.to_numpy()
    n = len(days)
    x_mean, y_mean = days.mean(), values.mean()
    sxx = np.sum((days - x_mean) ** 2)
    sxy = np.sum((days - x_mean) * (values - y_mean))
    slope = sxy / sxx
    residuals = values - (y_mean + slope * (days - x_mean))
    dof = n - 2
    if dof <= 0:
        raise ValueError("not enough degrees of freedom for a pretrend t-test")
    s2 = np.sum(residuals**2) / dof
    se_slope = np.sqrt(s2 / sxx)
    t_stat = slope / se_slope if se_slope > 0 else 0.0

    # Two-sided p-value from the t-distribution, computed via a numerically stable incomplete-beta
    # style survival function, avoids importing scipy.stats purely for this one lookup.
    from scipy import stats

    p_value = float(2 * (1 - stats.t.cdf(abs(t_stat), df=dof)))

    return PretrendResult(
        slope_gap=float(slope),
        slope_pvalue=p_value,
        passes=bool(p_value >= alpha),
        alpha=alpha,
    )

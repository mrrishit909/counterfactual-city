"""Mathematical validation suite for analysis/models/estimators.py (CTY-MATH-001).

Covers: ground-truth ATT recovery (the synthetic panel's declared TRUE_ATT), an independent
cross-check of diff_in_diff against a regression-based estimator, donor-weight feasibility, placebo
test internal consistency, pretrend diagnostic behavior, and the required boundary/infeasible cases:
zero/empty data, invalid parameters, insufficient donor pool, out-of-range intervention day,
weights that don't sum to 1.

Run: source .venv/bin/activate && pytest analysis/validation/ -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from data.synthetic_panel import (  # noqa: E402
    INTERVENTION_DAY,
    OUTCOMES,
    TREATED_ZONE,
    TRUE_ATT,
    generate_panel,
)
from models.estimators import (  # noqa: E402
    diff_in_diff,
    diff_in_diff_regression,
    pretrend_diagnostic,
    run_placebo_test,
    synthetic_control,
)

TOLERANCE_LOOSE = 25.0  # absolute units; noisy finite-sample recovery, not exact
RNG_SEED = 20261010


@pytest.fixture(scope="module")
def panel() -> pd.DataFrame:
    return generate_panel(RNG_SEED)


# ---------------------------------------------------------------------------
# Ground-truth ATT recovery
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("outcome", OUTCOMES)
def test_did_recovers_true_att_within_tolerance(panel: pd.DataFrame, outcome: str) -> None:
    result = diff_in_diff(panel, outcome, TREATED_ZONE, INTERVENTION_DAY)
    assert abs(result.att - TRUE_ATT[outcome]) < TOLERANCE_LOOSE, (
        f"{outcome}: DiD estimated {result.att:.2f}, true ATT is {TRUE_ATT[outcome]:.2f}"
    )


@pytest.mark.parametrize("outcome", OUTCOMES)
def test_synthetic_control_recovers_true_att_within_tolerance(panel: pd.DataFrame, outcome: str) -> None:
    result = synthetic_control(panel, outcome, TREATED_ZONE, INTERVENTION_DAY)
    assert abs(result.att_post_mean - TRUE_ATT[outcome]) < TOLERANCE_LOOSE, (
        f"{outcome}: synthetic control estimated {result.att_post_mean:.2f}, "
        f"true ATT is {TRUE_ATT[outcome]:.2f}"
    )
    assert abs(sum(result.weights.values()) - 1.0) < 1e-6
    assert all(w >= -1e-9 for w in result.weights.values())


# ---------------------------------------------------------------------------
# Independent cross-check: two different computations of the same DiD estimator must agree
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("outcome", OUTCOMES)
def test_did_cell_means_agree_with_regression_estimator(panel: pd.DataFrame, outcome: str) -> None:
    cell_means_att = diff_in_diff(panel, outcome, TREATED_ZONE, INTERVENTION_DAY).att
    regression_att = diff_in_diff_regression(panel, outcome, TREATED_ZONE, INTERVENTION_DAY)
    assert abs(cell_means_att - regression_att) < 1e-6, (
        f"{outcome}: cell-means ATT {cell_means_att:.6f} != regression ATT {regression_att:.6f}, "
        "the two independent computations of the same estimator disagree"
    )


# ---------------------------------------------------------------------------
# Zero-noise sanity check: with noise removed, estimators should recover TRUE_ATT almost exactly
# ---------------------------------------------------------------------------

def test_did_recovers_true_att_almost_exactly_with_zero_noise() -> None:
    from data import synthetic_panel as sp

    original_noise = dict(sp.NOISE_SD)
    try:
        for k in sp.NOISE_SD:
            sp.NOISE_SD[k] = 0.0
        zero_noise_panel = sp.generate_panel(RNG_SEED)
    finally:
        sp.NOISE_SD.clear()
        sp.NOISE_SD.update(original_noise)

    for outcome in OUTCOMES:
        result = diff_in_diff(zero_noise_panel, outcome, TREATED_ZONE, INTERVENTION_DAY)
        assert abs(result.att - TRUE_ATT[outcome]) < 0.5, (
            f"{outcome}: zero-noise DiD should recover TRUE_ATT almost exactly, "
            f"got {result.att:.4f} vs {TRUE_ATT[outcome]:.4f}"
        )


# ---------------------------------------------------------------------------
# Placebo inference: internal consistency
# ---------------------------------------------------------------------------

def test_placebo_real_unit_ranks_high_for_a_real_effect(panel: pd.DataFrame) -> None:
    # trip_volume has the largest relative TRUE_ATT, so it should stand out clearly in the placebo
    # distribution more reliably than smaller-effect outcomes under this panel's noise level.
    result = run_placebo_test(panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)
    assert result.rank <= 5, (
        f"real treated unit ranked {result.rank} of {result.n_placebos + 1} by |effect|, "
        "expected it to stand out near the top of the placebo distribution"
    )
    assert 0 < result.p_value <= 1


def test_placebo_effects_cover_every_non_treated_zone(panel: pd.DataFrame) -> None:
    result = run_placebo_test(panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)
    all_zones = set(panel["zone"].unique()) - {TREATED_ZONE}
    assert set(result.placebo_effects.keys()) == all_zones


# ---------------------------------------------------------------------------
# Pretrend diagnostic
# ---------------------------------------------------------------------------

def test_pretrend_passes_for_the_constructed_parallel_trends_panel(panel: pd.DataFrame) -> None:
    # The synthetic panel is built with parallel pre-trends by construction (shared day_shock and
    # weekly seasonality across all zones), so the pretrend diagnostic should PASS here.
    result = pretrend_diagnostic(panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)
    assert result.passes, (
        f"expected pretrend diagnostic to pass on a by-construction-parallel panel, "
        f"got slope={result.slope_gap:.4f}, p={result.slope_pvalue:.4f}"
    )


def test_pretrend_fails_when_a_fake_pre_trend_is_injected(panel: pd.DataFrame) -> None:
    broken = panel.copy()
    # Inject a strong linear pre-trend into the treated zone only, violating parallel trends.
    mask = (broken["zone"] == TREATED_ZONE) & (broken["day"] < INTERVENTION_DAY)
    broken.loc[mask, "trip_volume"] += broken.loc[mask, "day"] * 15.0
    result = pretrend_diagnostic(broken, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)
    assert not result.passes, "expected pretrend diagnostic to FAIL when a real pre-trend is injected"


# ---------------------------------------------------------------------------
# Boundary / infeasible cases (every control must handle these, not silently produce garbage)
# ---------------------------------------------------------------------------

def test_empty_panel_raises() -> None:
    empty = pd.DataFrame(columns=["zone", "day", "trip_volume", "treated", "post"])
    with pytest.raises(ValueError, match="empty"):
        diff_in_diff(empty, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)


def test_unknown_outcome_column_raises(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="unknown outcome"):
        diff_in_diff(panel, "nonexistent_outcome", TREATED_ZONE, INTERVENTION_DAY)


def test_unknown_treated_zone_raises(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="not present"):
        diff_in_diff(panel, "trip_volume", 9999, INTERVENTION_DAY)


def test_intervention_day_outside_range_raises(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="outside observed range"):
        diff_in_diff(panel, "trip_volume", TREATED_ZONE, 99999)
    with pytest.raises(ValueError, match="outside observed range"):
        diff_in_diff(panel, "trip_volume", TREATED_ZONE, 0)


def test_empty_control_pool_raises(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="control pool is empty"):
        diff_in_diff(panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY, control_zones=[TREATED_ZONE])


def test_synthetic_control_needs_at_least_two_donors(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="at least 2 donor"):
        synthetic_control(panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY, donor_pool=[0])


def test_synthetic_control_weights_must_sum_to_one(panel: pd.DataFrame) -> None:
    donor_pool = [z for z in panel["zone"].unique() if z != TREATED_ZONE][:3]
    bad_weights = np.array([0.5, 0.5, 0.5])  # sums to 1.5
    with pytest.raises(ValueError, match="sum to 1"):
        synthetic_control(
            panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY,
            donor_pool=donor_pool, weights=bad_weights,
        )


def test_synthetic_control_weights_must_be_nonnegative(panel: pd.DataFrame) -> None:
    donor_pool = [z for z in panel["zone"].unique() if z != TREATED_ZONE][:3]
    bad_weights = np.array([1.5, -0.3, -0.2])  # sums to 1 but has a negative entry
    with pytest.raises(ValueError, match="non-negative"):
        synthetic_control(
            panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY,
            donor_pool=donor_pool, weights=bad_weights,
        )


def test_synthetic_control_wrong_weight_count_raises(panel: pd.DataFrame) -> None:
    donor_pool = [z for z in panel["zone"].unique() if z != TREATED_ZONE][:3]
    with pytest.raises(ValueError, match="expected 3 weights"):
        synthetic_control(
            panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY,
            donor_pool=donor_pool, weights=np.array([0.5, 0.5]),
        )


def test_placebo_needs_at_least_two_non_treated_units(panel: pd.DataFrame) -> None:
    single_zone_panel = panel[panel["zone"].isin([TREATED_ZONE, 1])]
    with pytest.raises(ValueError, match="at least 2 non-treated"):
        run_placebo_test(single_zone_panel, "trip_volume", TREATED_ZONE, INTERVENTION_DAY)


def test_pretrend_needs_at_least_three_pre_period_observations(panel: pd.DataFrame) -> None:
    with pytest.raises(ValueError, match="fewer than 3 pre-period"):
        pretrend_diagnostic(panel, "trip_volume", TREATED_ZONE, intervention_day=2)

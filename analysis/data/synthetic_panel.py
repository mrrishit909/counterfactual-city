"""Generate THE COUNTERFACTUAL CITY's synthetic zone-by-time panel.

Declared data strategy (see specifications/DATA_CONTRACT.yaml and CTY-DATA-001): this is a FULLY
SYNTHETIC panel with a declared, injected treatment effect, not NYC TLC or any other real-world
measurement. The dossier (docs/PROJECT_SPEC.md) explicitly allows this as the fallback to "NYC TLC
Parquet taxi activity ... otherwise explicit simulated policy series"; a real compatible external
control series was not verified in this session, so the honest fallback is used, not a silent
substitute presented as real.

Knowing the TRUE injected effect lets the estimators in analysis/models/estimators.py be checked
against a known ground truth, not just internal consistency.

Panel structure:
  - N_ZONES zones (city blocks/neighborhoods), one is the treated unit.
  - N_DAYS days, split into a pre-period and a post-period at a declared intervention date.
  - 3 outcome series per zone-day (CTY-INT-006, "change outcome" needs multiple compatible series):
    trip_volume, avg_speed_kmh, transit_ridership.
  - Zone fixed effects + a common daily shock + idiosyncratic noise, so pre-treatment trends are
    parallel BY CONSTRUCTION outside of noise (this is a designed validation fixture, not a claim
    about real cities).
  - A declared, deterministic treatment effect added only to the treated zone from the intervention
    date forward, per outcome (so the "ground truth" ATT is known exactly, before estimation noise).
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20261010
N_ZONES = 24
N_DAYS = 180
INTERVENTION_DAY = 120  # 0-indexed day the treatment begins (post-period starts here)
TREATED_ZONE = 7

OUTCOMES = ("trip_volume", "avg_speed_kmh", "transit_ridership")

# Declared ground-truth average treatment effect on the treated (ATT), per outcome, applied as a
# constant additive shift from INTERVENTION_DAY onward. Units match each outcome's own column.
TRUE_ATT: dict[str, float] = {
    "trip_volume": -180.0,       # policy reduces daily trips in the treated zone
    "avg_speed_kmh": 3.2,        # fewer trips -> less congestion -> higher average speed
    "transit_ridership": 240.0,  # some displaced trips shift to transit
}

BASELINE: dict[str, float] = {
    "trip_volume": 2400.0,
    "avg_speed_kmh": 28.0,
    "transit_ridership": 1800.0,
}

NOISE_SD: dict[str, float] = {
    "trip_volume": 90.0,
    "avg_speed_kmh": 1.1,
    "transit_ridership": 70.0,
}


@dataclass(frozen=True)
class PanelManifest:
    seed: int
    n_zones: int
    n_days: int
    intervention_day: int
    treated_zone: int
    outcomes: tuple[str, ...]
    true_att: dict[str, float]
    checksum: str = field(default="")


def generate_panel(seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    zones = np.arange(N_ZONES)
    days = np.arange(N_DAYS)

    # Zone fixed effects: each zone has its own stable level offset (declared synthetic, drawn once).
    zone_fx = {o: rng.normal(0, BASELINE[o] * 0.08, size=N_ZONES) for o in OUTCOMES}

    # Common daily shock shared by ALL zones (so pre-trends are parallel by construction: this shock
    # hits treated and control zones identically before treatment).
    day_shock = {o: rng.normal(0, BASELINE[o] * 0.03, size=N_DAYS) for o in OUTCOMES}

    # Mild weekly seasonality (day-of-week pattern), shared across zones.
    dow = days % 7
    weekly = {o: BASELINE[o] * 0.05 * np.sin(2 * np.pi * dow / 7) for o in OUTCOMES}

    rows = []
    for z in zones:
        for d in days:
            row = {"zone": int(z), "day": int(d)}
            is_treated_period = (z == TREATED_ZONE) and (d >= INTERVENTION_DAY)
            for o in OUTCOMES:
                value = (
                    BASELINE[o]
                    + zone_fx[o][z]
                    + day_shock[o][d]
                    + weekly[o][d]
                    + rng.normal(0, NOISE_SD[o])
                )
                if is_treated_period:
                    value += TRUE_ATT[o]
                row[o] = float(value)
            row["treated"] = bool(z == TREATED_ZONE)
            row["post"] = bool(d >= INTERVENTION_DAY)
            rows.append(row)

    return pd.DataFrame(rows)


def _checksum(df: pd.DataFrame) -> str:
    payload = df.to_csv(index=False).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def write_fixtures(out_dir: Path) -> PanelManifest:
    out_dir.mkdir(parents=True, exist_ok=True)
    df = generate_panel(SEED)
    checksum = _checksum(df)

    df.to_parquet(out_dir / "panel.parquet", index=False)
    df.to_csv(out_dir / "panel.csv", index=False)

    manifest = PanelManifest(
        seed=SEED,
        n_zones=N_ZONES,
        n_days=N_DAYS,
        intervention_day=INTERVENTION_DAY,
        treated_zone=TREATED_ZONE,
        outcomes=OUTCOMES,
        true_att=TRUE_ATT,
        checksum=checksum,
    )
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "seed": manifest.seed,
                "n_zones": manifest.n_zones,
                "n_days": manifest.n_days,
                "intervention_day": manifest.intervention_day,
                "treated_zone": manifest.treated_zone,
                "outcomes": list(manifest.outcomes),
                "true_att": manifest.true_att,
                "checksum_sha256": manifest.checksum,
                "data_strategy": "fully synthetic, declared treatment, not NYC TLC or any real "
                "measurement; see specifications/DATA_CONTRACT.yaml",
            },
            indent=2,
        )
    )
    return manifest


if __name__ == "__main__":
    m = write_fixtures(Path(__file__).parent)
    print(f"Wrote panel.parquet / panel.csv / manifest.json, checksum={m.checksum[:16]}...")

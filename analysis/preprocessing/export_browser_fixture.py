"""Export the synthetic panel (analysis/data/panel.parquet) to a browser-loadable JSON fixture.

Run after analysis/data/synthetic_panel.py. Writes public/data/panel.json plus a small manifest
with the same checksum as the Python-side manifest, so a browser load can be checked against the
same provenance record the Python reference implementation uses.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "analysis"))

from data.synthetic_panel import INTERVENTION_DAY, N_DAYS, N_ZONES, OUTCOMES, TREATED_ZONE  # noqa: E402


def export(out_path: Path) -> None:
    df = pd.read_parquet(ROOT / "analysis" / "data" / "panel.parquet")
    manifest = json.loads((ROOT / "analysis" / "data" / "manifest.json").read_text())

    payload = {
        "meta": {
            "n_zones": N_ZONES,
            "n_days": N_DAYS,
            "intervention_day": INTERVENTION_DAY,
            "treated_zone": TREATED_ZONE,
            "outcomes": list(OUTCOMES),
            "checksum_sha256": manifest["checksum_sha256"],
            "data_strategy": manifest["data_strategy"],
        },
        "rows": df.to_dict(orient="records"),
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload))
    print(f"Wrote {out_path} ({len(payload['rows'])} rows, checksum {manifest['checksum_sha256'][:16]}...)")


if __name__ == "__main__":
    export(ROOT / "public" / "data" / "panel.json")

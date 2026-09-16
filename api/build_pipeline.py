#!/usr/bin/env python3
"""
Fit the release-point anomaly pipeline on data/pitch_data.csv and dump a
bundle (dict) to pipeline.joblib for serve.py / modal_serve.py to load.

Pipeline:
    1. ReleasePointDeviationTransformer (custom, pipeline_def.py) — turns
       each pitch's (Pitcher, RelHeight, RelSide, Extension) into how far
       it deviates from that pitcher's own release-point centroid, learned
       from this game's pitches.
    2. StandardScaler — normalizes the deviation features.
    3. IsolationForest — scores each pitch's release point for how
       anomalous it is relative to the fitted population of deviations.

The dumped bundle also carries the sorted list of pitchers seen during fit
(so the API can tell a caller whether their input pitcher is "known"), and
metadata (steps, build timestamp, sklearn version) for the API's /info
endpoint.

Usage:
    uv run --python .venv/bin/python build_pipeline.py
    (or: python3 build_pipeline.py, from within api/.venv)
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_def import FEATURE_COLS, ReleasePointDeviationTransformer

ROOT = Path(__file__).resolve().parent.parent
DATA_CSV = ROOT / "data" / "pitch_data.csv"
OUT_PATH = Path(__file__).resolve().parent / "pipeline.joblib"

RANDOM_STATE = 42


def main() -> None:
    if not DATA_CSV.exists():
        raise SystemExit(f"missing {DATA_CSV}")

    df = pd.read_csv(DATA_CSV)
    df = df.dropna(subset=["Pitcher", *FEATURE_COLS]).copy()

    pipeline = Pipeline(
        steps=[
            ("release_deviation", ReleasePointDeviationTransformer()),
            ("scaler", StandardScaler()),
            (
                "iforest",
                IsolationForest(
                    n_estimators=200,
                    contamination=0.1,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )
    pipeline.fit(df)

    deviation_step: ReleasePointDeviationTransformer = pipeline.named_steps["release_deviation"]

    bundle = {
        "pipeline": pipeline,
        "feature_cols": list(FEATURE_COLS),
        "pitcher_col": "Pitcher",
        "known_pitchers": deviation_step.pitchers_,
        "global_release_mean": {
            col: float(val) for col, val in zip(FEATURE_COLS, deviation_step.global_mean_)
        },
        "metadata": {
            "steps": [name for name, _ in pipeline.steps],
            "built_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "sklearn_version": sklearn.__version__,
            "n_training_pitches": int(len(df)),
            "n_pitchers": len(deviation_step.pitchers_),
            "source_csv": str(DATA_CSV.relative_to(ROOT)),
            "model": "ReleasePointDeviationTransformer -> StandardScaler -> IsolationForest",
        },
    }

    joblib.dump(bundle, OUT_PATH)

    print(f"fit pipeline on {len(df)} pitches, {len(deviation_step.pitchers_)} pitchers")
    print(f"sklearn version: {sklearn.__version__}")
    print(f"wrote {OUT_PATH}")
    print(json.dumps(bundle["metadata"], indent=2))


if __name__ == "__main__":
    main()

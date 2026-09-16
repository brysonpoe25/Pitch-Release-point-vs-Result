"""
FastAPI service for the release-point anomaly pipeline.

Loads the fitted pipeline bundle (pipeline.joblib) once at import time and
serves it. Every request runs through the *same* fitted pipeline object —
nothing is refit or rebuilt per request.

Endpoints:
    GET  /          -> liveness
    GET  /info      -> describes the loaded artifact (steps, metadata, etc.)
    POST /score     -> runs one pitch through the pipeline

Run locally:
    uvicorn serve:app --reload
    -> http://localhost:8000/docs
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import joblib
import pandas as pd
import sklearn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ARTIFACT_PATH = Path(__file__).resolve().parent / "pipeline.joblib"

app = FastAPI(
    title="Release-Point Anomaly API",
    description=(
        "Scores a single pitch's release point (height/side/extension) for "
        "how anomalous it is relative to that pitcher's own release-point "
        "fingerprint, learned from a college baseball TrackMan game."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Load the fitted artifact once at import. If this fails, BUNDLE stays None
# and every request-handling endpoint returns 503 instead of crashing.
# ---------------------------------------------------------------------------
BUNDLE: Optional[dict] = None
LOAD_ERROR: Optional[str] = None

try:
    BUNDLE = joblib.load(ARTIFACT_PATH)
except Exception as exc:  # noqa: BLE001 - surfaced via /info and 503s, not raised at import
    LOAD_ERROR = f"{type(exc).__name__}: {exc}"


def get_bundle() -> dict:
    if BUNDLE is None:
        raise HTTPException(
            status_code=503,
            detail=f"pipeline artifact not loaded: {LOAD_ERROR or 'unknown error'}",
        )
    return BUNDLE


class ScoreRequest(BaseModel):
    pitcher: str = Field(
        ..., min_length=1, max_length=200,
        description="Pitcher name, e.g. 'Purvis, Drake'. Unknown pitchers fall back to the league-wide release-point baseline.",
    )
    rel_height: float = Field(
        ..., ge=3.0, le=8.0,
        description="Release height in feet (typical human release range).",
    )
    rel_side: float = Field(
        ..., ge=-6.0, le=6.0,
        description="Release side in feet, catcher's-view (negative = third-base side for a RHP).",
    )
    extension: float = Field(
        ..., ge=2.0, le=9.0,
        description="Release extension toward the plate, in feet.",
    )


class ScoreResponse(BaseModel):
    pitcher: str
    known_pitcher: bool
    deviation_from_baseline: dict
    euclidean_deviation_ft: float
    anomaly_score: float
    is_anomaly: bool


@app.get("/")
def root() -> dict:
    return {"status": "ok", "service": "release-point-anomaly-api"}


@app.get("/info")
def info() -> dict:
    bundle = get_bundle()
    metadata = bundle["metadata"]
    return {
        "artifact_path": ARTIFACT_PATH.name,
        "steps": metadata["steps"],
        "built_at": metadata["built_at"],
        "sklearn_version_at_fit": metadata["sklearn_version"],
        "sklearn_version_running": sklearn.__version__,
        "n_training_pitches": metadata["n_training_pitches"],
        "n_pitchers": metadata["n_pitchers"],
        "known_pitchers": bundle["known_pitchers"],
        "feature_cols": bundle["feature_cols"],
        "model": metadata["model"],
    }


@app.post("/score", response_model=ScoreResponse)
def score(request: ScoreRequest) -> ScoreResponse:
    bundle = get_bundle()
    pipeline = bundle["pipeline"]

    row = pd.DataFrame(
        [
            {
                "Pitcher": request.pitcher,
                "RelHeight": request.rel_height,
                "RelSide": request.rel_side,
                "Extension": request.extension,
            }
        ]
    )

    deviation_step = pipeline.named_steps["release_deviation"]
    deviation = deviation_step.transform(row)[0]
    dev_height, dev_side, dev_extension, euclidean_dev = deviation

    # -1 = anomaly, 1 = inlier (IsolationForest convention)
    prediction = pipeline.predict(row)[0]
    anomaly_score = float(pipeline.decision_function(row)[0])

    return ScoreResponse(
        pitcher=request.pitcher,
        known_pitcher=request.pitcher in bundle["known_pitchers"],
        deviation_from_baseline={
            "rel_height_ft": round(float(dev_height), 4),
            "rel_side_ft": round(float(dev_side), 4),
            "extension_ft": round(float(dev_extension), 4),
        },
        euclidean_deviation_ft=round(float(euclidean_dev), 4),
        anomaly_score=round(anomaly_score, 6),
        is_anomaly=bool(prediction == -1),
    )

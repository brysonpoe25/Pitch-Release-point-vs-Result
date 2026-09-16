"""
Custom transformer for the release-point anomaly pipeline.

ReleasePointDeviationTransformer learns each pitcher's own release-point
"fingerprint" (mean release height/side/extension) at fit time, then turns
any new pitch into how far it deviates from *that pitcher's* fingerprint
(or the league-wide fingerprint, for a pitcher never seen during fit).

This is the piece of learned state that makes the pipeline meaningless if
rebuilt from scratch at request time: the per-pitcher centroids come from
the training game's pitches, not from whatever one row the API receives.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

FEATURE_COLS = ["RelHeight", "RelSide", "Extension"]


class ReleasePointDeviationTransformer(BaseEstimator, TransformerMixin):
    """Map (pitcher, RelHeight, RelSide, Extension) -> deviation-from-own-baseline features.

    Output columns, in order:
        dev_rel_height, dev_rel_side, dev_extension, euclidean_dev
    where dev_* = raw value - that pitcher's fitted mean for that feature
    (falling back to the global mean for an unseen pitcher), and
    euclidean_dev is the L2 norm of the three deviations.
    """

    def __init__(self, pitcher_col: str = "Pitcher", feature_cols: tuple[str, ...] = tuple(FEATURE_COLS)):
        self.pitcher_col = pitcher_col
        self.feature_cols = feature_cols

    def fit(self, X: pd.DataFrame, y=None) -> "ReleasePointDeviationTransformer":
        X = pd.DataFrame(X)
        cols = list(self.feature_cols)

        self.global_mean_ = X[cols].mean().to_numpy(dtype=float)

        self.pitcher_means_ = {
            pitcher: group[cols].mean().to_numpy(dtype=float)
            for pitcher, group in X.groupby(self.pitcher_col)
        }
        self.pitchers_ = sorted(self.pitcher_means_.keys())
        self.n_features_in_ = len(cols)
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        X = pd.DataFrame(X)
        cols = list(self.feature_cols)

        raw = X[cols].to_numpy(dtype=float)
        centroids = np.array(
            [
                self.pitcher_means_.get(pitcher, self.global_mean_)
                for pitcher in X[self.pitcher_col]
            ],
            dtype=float,
        )

        deviation = raw - centroids
        euclidean_dev = np.linalg.norm(deviation, axis=1, keepdims=True)
        return np.hstack([deviation, euclidean_dev])

    def get_feature_names_out(self, input_features=None) -> np.ndarray:
        name_map = {"RelHeight": "dev_rel_height", "RelSide": "dev_rel_side", "Extension": "dev_extension"}
        base = [name_map.get(c, f"dev_{c}") for c in self.feature_cols]
        return np.array(base + ["euclidean_dev"])

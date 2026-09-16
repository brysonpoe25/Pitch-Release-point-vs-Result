# Release-Point Anomaly API

Assignment 4: a fitted scikit-learn `Pipeline`, served with FastAPI, deployed
on Modal. Answers a version of the same question as the rest of this repo —
*does where a pitcher releases the ball look normal for that pitcher?* —
by scoring each pitch's release point against that pitcher's own learned
release-point fingerprint.

## Pipeline

```
ReleasePointDeviationTransformer (custom, pipeline_def.py)
    -> StandardScaler
    -> IsolationForest
```

`ReleasePointDeviationTransformer` is fit on `data/pitch_data.csv` (315
pitches, 8 pitchers from a real TrackMan college-game export). At `fit()`
time it learns each pitcher's mean release height/side/extension —
learned state that is meaningless if the pipeline is rebuilt from scratch
per request. At `transform()` time it turns a new pitch into how far it
deviates from *that pitcher's* centroid (falling back to the league-wide
centroid for an unseen pitcher). `StandardScaler` normalizes those
deviations, and `IsolationForest` scores how anomalous the deviation
pattern is relative to the fitted population.

- Custom transformer: `ReleasePointDeviationTransformer` (`pipeline_def.py`)
- sklearn version pinned at fit time: **1.9.1** (see `pipeline.joblib`'s
  `metadata.sklearn_version`, echoed by `GET /info`)

## Files

| File | Purpose |
|---|---|
| `pipeline_def.py` | Custom transformer, imported by both the build script and the API |
| `build_pipeline.py` | Fits the pipeline on `../data/pitch_data.csv`, dumps `pipeline.joblib` |
| `serve.py` | FastAPI app — loads the artifact once at import |
| `modal_serve.py` | Modal deployment wrapping `serve.py` |
| `pipeline.joblib` | The fitted bundle (pipeline + known pitchers + metadata) |
| `postman_collection.json` | Postman collection with assertions against the deployed URL |
| `requirements.txt` | Pinned dependency versions (matches the Modal image) |

## Run locally

```bash
cd api
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r requirements.txt
./.venv/bin/python build_pipeline.py      # (re)fits pipeline.joblib — optional, already committed
./.venv/bin/uvicorn serve:app --reload
```

Open http://localhost:8000/docs.

- `GET /info` — describes the loaded artifact (steps, built_at, sklearn
  version, known pitchers)
- `POST /score` — body: `{"pitcher": str, "rel_height": float, "rel_side":
  float, "extension": float}` (Pydantic-bounded — out-of-range or missing
  fields return 422)
- If `pipeline.joblib` is missing/unloadable, every data endpoint returns
  503 instead of crashing.

## Deploy to Modal

Requires a Modal account (`modal.com`) and its CLI/SDK, already pinned in
`requirements.txt`.

```bash
cd api
modal token new          # one-time browser login, if you haven't already
modal deploy modal_serve.py
```

`modal deploy` prints a public URL. **Deployed URL for this project:**

```
https://brysonpoe25--release-point-anomaly-api-fastapi-app.modal.run
```

Interactive docs: <https://brysonpoe25--release-point-anomaly-api-fastapi-app.modal.run/docs>

That URL (not localhost) is wired into:

- the frontend (`web/` — the `/anomaly` page, via `NEXT_PUBLIC_PIPELINE_API_URL`
  in `web/.env.example` / `web/.env.local`)
- `postman_collection.json`'s `baseUrl` collection variable

The Modal image ships exactly three files (`serve.py`, `pipeline_def.py`,
`pipeline.joblib`) and pins `scikit-learn==1.9.1` to match the version the
artifact was fitted with, so it never rebuilds the pipeline at boot and
never hits a version mismatch on unpickling.

## Postman

`postman_collection.json` covers health (`GET /`), pipeline info
(`GET /info`), a valid `POST /score` (expect 200), and two invalid
`POST /score` calls — out-of-bounds and missing field (expect 422) — all
asserted against the `baseUrl` variable, defaulted to the deployed Modal
URL above. Verified with `newman` against a local instance (14/15
assertions pass; the 15th is an intentional guard that fails on purpose if
`baseUrl` is ever pointed at localhost).

Import into Postman, run each request, and screenshot the valid (200) and
an invalid (422) response for the Canvas submission.

"""
Modal deployment for the release-point anomaly API.

Ships exactly three files into the image: serve.py, pipeline_def.py, and the
fitted pipeline.joblib artifact. scikit-learn is pinned to the exact version
recorded in the artifact's metadata at fit time (see build_pipeline.py) so
the pipeline unpickles with the same library version it was fitted with.

Deploy:
    modal deploy modal_serve.py

Then copy the printed URL (looks like
https://<workspace>--release-point-anomaly-api.modal.run) and use it as the
API base URL for the frontend, Postman collection, and Canvas submission.
"""

from pathlib import Path

import modal

LOCAL_DIR = Path(__file__).resolve().parent

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "fastapi==0.141.1",
        "scikit-learn==1.9.1",
        "pandas==3.0.5",
        "numpy==2.5.3",
        "joblib==1.6.0",
    )
    .add_local_file(LOCAL_DIR / "pipeline_def.py", "/app/pipeline_def.py")
    .add_local_file(LOCAL_DIR / "serve.py", "/app/serve.py")
    .add_local_file(LOCAL_DIR / "pipeline.joblib", "/app/pipeline.joblib")
)

app = modal.App("release-point-anomaly-api", image=image)


@app.function()
@modal.concurrent(max_inputs=100)
@modal.asgi_app()
def fastapi_app():
    import sys

    sys.path.insert(0, "/app")

    from serve import app as web_app

    return web_app

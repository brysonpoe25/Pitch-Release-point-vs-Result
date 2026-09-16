// Base URL of the deployed Release-Point Anomaly API (see ../../api/).
// Falls back to the live Modal deployment so the site never silently talks
// to localhost or fake data even if the env var isn't set on the host.
export const PIPELINE_API_URL =
  process.env.NEXT_PUBLIC_PIPELINE_API_URL ??
  "https://brysonpoe25--release-point-anomaly-api-fastapi-app.modal.run";

export type PipelineInfo = {
  artifact_path: string;
  steps: string[];
  built_at: string;
  sklearn_version_at_fit: string;
  sklearn_version_running: string;
  n_training_pitches: number;
  n_pitchers: number;
  known_pitchers: string[];
  feature_cols: string[];
  model: string;
};

export type ScoreRequest = {
  pitcher: string;
  rel_height: number;
  rel_side: number;
  extension: number;
  spin_rate: number;
};

export type ScoreResponse = {
  pitcher: string;
  known_pitcher: boolean;
  deviation_from_baseline: {
    rel_height_ft: number;
    rel_side_ft: number;
    extension_ft: number;
    spin_rate_rpm: number;
  };
  euclidean_deviation_ft: number;
  anomaly_score: number;
  is_anomaly: boolean;
};

export async function fetchPipelineInfo(): Promise<PipelineInfo> {
  const res = await fetch(`${PIPELINE_API_URL}/info`);
  if (!res.ok) {
    throw new Error(`GET /info failed: ${res.status}`);
  }
  return res.json();
}

export async function scorePitch(body: ScoreRequest): Promise<ScoreResponse> {
  const res = await fetch(`${PIPELINE_API_URL}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(
      detail?.detail ? JSON.stringify(detail.detail) : `POST /score failed: ${res.status}`
    );
  }
  return res.json();
}

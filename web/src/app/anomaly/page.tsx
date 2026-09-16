import type { Metadata } from "next";

import { AnomalyClient } from "@/components/anomaly/anomaly-client";

export const metadata: Metadata = {
  title: "Release-Point Anomaly",
};

export default function AnomalyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Release-Point Anomaly Scorer</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        A fitted scikit-learn <code>Pipeline</code> — a custom transformer that
        learned each pitcher&apos;s release-point and spin-rate centroid,
        feeding a <code>StandardScaler</code> and an <code>IsolationForest</code> —
        served by FastAPI and deployed on Modal. Pick a pitcher, a release
        point, and a spin rate to see how anomalous it looks relative to that
        pitcher&apos;s own fingerprint from the FinchField game.
      </p>

      <div className="mt-8">
        <AnomalyClient />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PIPELINE_API_URL,
  fetchPipelineInfo,
  scorePitch,
  type PipelineInfo,
  type ScoreResponse,
} from "@/lib/pipeline-api";

const DEFAULT_FORM = {
  pitcher: "",
  rel_height: "5.9",
  rel_side: "-0.55",
  extension: "5.95",
  spin_rate: "2320",
};

export function AnomalyClient() {
  const [info, setInfo] = useState<PipelineInfo | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPipelineInfo()
      .then((data) => {
        setInfo(data);
        setForm((f) => (f.pitcher ? f : { ...f, pitcher: data.known_pitchers[0] ?? "" }));
      })
      .catch((err) => setInfoError(err instanceof Error ? err.message : String(err)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await scorePitch({
        pitcher: form.pitcher,
        rel_height: Number(form.rel_height),
        rel_side: Number(form.rel_side),
        extension: Number(form.extension),
        spin_rate: Number(form.spin_rate),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Score a pitch</CardTitle>
          <CardDescription>
            Sends this pitch&apos;s release point to the live pipeline API — a fitted
            scikit-learn <code>Pipeline</code> deployed on Modal, not a local mock.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pitcher">Pitcher</Label>
              {info ? (
                <Select
                  value={form.pitcher}
                  onValueChange={(v) => setForm((f) => ({ ...f, pitcher: v }))}
                >
                  <SelectTrigger id="pitcher" className="w-full">
                    <SelectValue placeholder="Select a pitcher" />
                  </SelectTrigger>
                  <SelectContent>
                    {info.known_pitchers.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                    <SelectItem value="Unknown Pitcher">
                      Unknown Pitcher (league baseline)
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="pitcher"
                  value={form.pitcher}
                  onChange={(e) => setForm((f) => ({ ...f, pitcher: e.target.value }))}
                  placeholder="e.g. Purvis, Drake"
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rel_height">Release height (ft)</Label>
                <Input
                  id="rel_height"
                  type="number"
                  step="0.01"
                  min={3}
                  max={8}
                  value={form.rel_height}
                  onChange={(e) => setForm((f) => ({ ...f, rel_height: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rel_side">Release side (ft)</Label>
                <Input
                  id="rel_side"
                  type="number"
                  step="0.01"
                  min={-6}
                  max={6}
                  value={form.rel_side}
                  onChange={(e) => setForm((f) => ({ ...f, rel_side: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="extension">Extension (ft)</Label>
                <Input
                  id="extension"
                  type="number"
                  step="0.01"
                  min={2}
                  max={9}
                  value={form.extension}
                  onChange={(e) => setForm((f) => ({ ...f, extension: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="spin_rate">Spin rate (rpm)</Label>
                <Input
                  id="spin_rate"
                  type="number"
                  step="1"
                  min={500}
                  max={4000}
                  value={form.spin_rate}
                  onChange={(e) => setForm((f) => ({ ...f, spin_rate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading || !form.pitcher} className="w-fit">
              {loading && <Loader2Icon className="animate-spin" />}
              Score this pitch
            </Button>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>From <code>POST {PIPELINE_API_URL}/score</code></CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <p className="text-sm text-muted-foreground">
                Submit the form to score a pitch against the pitcher&apos;s learned
                release-point baseline.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {result.is_anomaly ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangleIcon /> Anomalous release point
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-accent text-accent-foreground">
                      <CheckCircle2Icon /> Normal release point
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {result.known_pitcher ? "Known pitcher" : "Unknown pitcher (league baseline)"}
                  </Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Anomaly score</dt>
                  <dd className="text-right tabular-nums">{result.anomaly_score.toFixed(4)}</dd>
                  <dt className="text-muted-foreground">Euclidean deviation</dt>
                  <dd className="text-right tabular-nums">
                    {result.euclidean_deviation_ft.toFixed(3)} ft
                  </dd>
                  <dt className="text-muted-foreground">Δ release height</dt>
                  <dd className="text-right tabular-nums">
                    {result.deviation_from_baseline.rel_height_ft.toFixed(3)} ft
                  </dd>
                  <dt className="text-muted-foreground">Δ release side</dt>
                  <dd className="text-right tabular-nums">
                    {result.deviation_from_baseline.rel_side_ft.toFixed(3)} ft
                  </dd>
                  <dt className="text-muted-foreground">Δ extension</dt>
                  <dd className="text-right tabular-nums">
                    {result.deviation_from_baseline.extension_ft.toFixed(3)} ft
                  </dd>
                  <dt className="text-muted-foreground">Δ spin rate</dt>
                  <dd className="text-right tabular-nums">
                    {result.deviation_from_baseline.spin_rate_rpm.toFixed(1)} rpm
                  </dd>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline artifact</CardTitle>
            <CardDescription>From <code>GET {PIPELINE_API_URL}/info</code></CardDescription>
          </CardHeader>
          <CardContent>
            {infoError ? (
              <p className="text-xs text-destructive">
                Could not reach the API: {infoError}
              </p>
            ) : !info ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Steps</dt>
                <dd className="text-right">{info.steps.join(" → ")}</dd>
                <dt className="text-muted-foreground">scikit-learn</dt>
                <dd className="text-right tabular-nums">{info.sklearn_version_at_fit}</dd>
                <dt className="text-muted-foreground">Built at</dt>
                <dd className="text-right tabular-nums">
                  {new Date(info.built_at).toLocaleString()}
                </dd>
                <dt className="text-muted-foreground">Training pitches</dt>
                <dd className="text-right tabular-nums">{info.n_training_pitches}</dd>
                <dt className="text-muted-foreground">Pitchers learned</dt>
                <dd className="text-right tabular-nums">{info.n_pitchers}</dd>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

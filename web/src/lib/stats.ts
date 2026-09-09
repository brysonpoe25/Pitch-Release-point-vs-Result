import type { Pitch } from "@/lib/types";

export function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]): number | null {
  if (values.length < 2) return null;
  const m = mean(values)!;
  const variance =
    values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function nums(pitches: Pitch[], key: keyof Pitch): number[] {
  return pitches
    .map((p) => p[key])
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
}

export interface OutcomeSummaryRow {
  outcome: string;
  count: number;
  avgRelHeight: number | null;
  avgRelSide: number | null;
  avgExtension: number | null;
  avgRelSpeed: number | null;
  avgExitSpeed: number | null;
}

export function summarizeByOutcome(pitches: Pitch[]): OutcomeSummaryRow[] {
  const groups = new Map<string, Pitch[]>();
  for (const p of pitches) {
    const g = groups.get(p.outcome) ?? [];
    g.push(p);
    groups.set(p.outcome, g);
  }

  return Array.from(groups.entries()).map(([outcome, rows]) => ({
    outcome,
    count: rows.length,
    avgRelHeight: mean(nums(rows, "rel_height")),
    avgRelSide: mean(nums(rows, "rel_side")),
    avgExtension: mean(nums(rows, "extension")),
    avgRelSpeed: mean(nums(rows, "rel_speed")),
    avgExitSpeed: mean(nums(rows, "exit_speed")),
  }));
}

export interface PitcherSummaryRow {
  pitcherId: number;
  pitcher: string;
  throws: string;
  pitches: number;
  pitchTypes: number;
  avgRelSpeed: number | null;
  avgSpinRate: number | null;
  avgRelHeight: number | null;
  avgRelSide: number | null;
  releaseConsistency: number | null; // lower stddev = more repeatable
  whiffRate: number | null; // swinging strikes / (swinging strike + foul + in play)
  strikeRate: number | null; // non-ball pitches / total
}

export function summarizeByPitcher(pitches: Pitch[]): PitcherSummaryRow[] {
  const groups = new Map<number, Pitch[]>();
  for (const p of pitches) {
    const g = groups.get(p.pitcher_id) ?? [];
    g.push(p);
    groups.set(p.pitcher_id, g);
  }

  return Array.from(groups.entries()).map(([pitcherId, rows]) => {
    const swings = rows.filter((r) =>
      ["Swinging Strike", "Foul", "In Play: Out", "In Play: Hit", "In Play: Other"].includes(
        r.outcome
      )
    );
    const whiffs = rows.filter((r) => r.outcome === "Swinging Strike");
    const balls = rows.filter((r) => r.outcome === "Ball");

    const relHeights = nums(rows, "rel_height");
    const relSides = nums(rows, "rel_side");

    return {
      pitcherId,
      pitcher: rows[0].pitcher_name,
      throws: rows[0].pitcher_throws,
      pitches: rows.length,
      pitchTypes: new Set(rows.map((r) => r.tagged_pitch_type)).size,
      avgRelSpeed: mean(nums(rows, "rel_speed")),
      avgSpinRate: mean(nums(rows, "spin_rate")),
      avgRelHeight: mean(relHeights),
      avgRelSide: mean(relSides),
      releaseConsistency: combineSpread(stddev(relHeights), stddev(relSides)),
      whiffRate: swings.length ? whiffs.length / swings.length : null,
      strikeRate: rows.length ? (rows.length - balls.length) / rows.length : null,
    };
  });
}

function combineSpread(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return Math.sqrt((a ?? 0) ** 2 + (b ?? 0) ** 2);
}

export function uniqueSorted<T>(values: T[]): T[] {
  return Array.from(new Set(values)).sort();
}

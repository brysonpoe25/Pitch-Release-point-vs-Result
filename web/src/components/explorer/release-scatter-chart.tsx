"use client";

import * as React from "react";
import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { OUTCOME_COLORS, OUTCOME_ORDER } from "@/lib/outcomes";
import type { Outcome, Pitch } from "@/lib/types";

interface Axis {
  key: keyof Pitch;
  label: string;
}

const AXES: Record<"height" | "side", Axis> = {
  side: { key: "rel_side", label: "Release Side (ft, catcher's view)" },
  height: { key: "rel_height", label: "Release Height (ft)" },
};

function ReleaseTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: Pitch }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 flex items-center gap-1.5 font-medium">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: OUTCOME_COLORS[p.outcome] }}
        />
        {p.outcome}
      </div>
      <div className="grid grid-cols-[auto_auto] gap-x-3 text-muted-foreground">
        <span>Pitcher</span>
        <span className="text-right text-foreground">{p.pitcher_name}</span>
        <span>Pitch type</span>
        <span className="text-right text-foreground">{p.tagged_pitch_type}</span>
        <span>Release ht / side</span>
        <span className="text-right font-mono text-foreground">
          {p.rel_height?.toFixed(2)} / {p.rel_side?.toFixed(2)} ft
        </span>
        <span>Velo</span>
        <span className="text-right font-mono text-foreground">
          {p.rel_speed?.toFixed(1)} mph
        </span>
      </div>
    </div>
  );
}

export function ReleaseScatterChart({ pitches }: { pitches: Pitch[] }) {
  const byOutcome = React.useMemo(() => {
    const map = new Map<Outcome, Pitch[]>();
    for (const outcome of OUTCOME_ORDER) map.set(outcome, []);
    for (const p of pitches) {
      const arr = map.get(p.outcome) ?? [];
      arr.push(p);
      map.set(p.outcome, arr);
    }
    return map;
  }, [pitches]);

  return (
    <ChartContainer
      config={Object.fromEntries(
        OUTCOME_ORDER.map((o) => [o, { label: o, color: OUTCOME_COLORS[o] }])
      )}
      className="aspect-auto h-[420px] w-full"
    >
      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          dataKey={AXES.side.key}
          name={AXES.side.label}
          label={{ value: AXES.side.label, position: "bottom", offset: 0, fontSize: 11 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey={AXES.height.key}
          name={AXES.height.label}
          label={{
            value: AXES.height.label,
            angle: -90,
            position: "insideLeft",
            fontSize: 11,
          }}
          tick={{ fontSize: 11 }}
        />
        <ReferenceLine x={0} stroke="var(--border)" strokeDasharray="4 4" />
        <Tooltip content={<ReleaseTooltip />} cursor={{ strokeDasharray: "3 3" }} />
        {OUTCOME_ORDER.map((outcome) => {
          const data = byOutcome.get(outcome);
          if (!data?.length) return null;
          return (
            <Scatter
              key={outcome}
              name={outcome}
              data={data}
              fill={OUTCOME_COLORS[outcome]}
              fillOpacity={0.8}
            />
          );
        })}
      </ScatterChart>
    </ChartContainer>
  );
}

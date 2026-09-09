"use client";

import * as React from "react";
import {
  CartesianGrid,
  ReferenceArea,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { OUTCOME_COLORS, OUTCOME_ORDER } from "@/lib/outcomes";
import type { Outcome, Pitch } from "@/lib/types";

// Approximate rulebook strike zone (17in plate, ~1.5-3.5 ft vertically),
// matching app.py's Section 5 zone box.
const ZONE = { left: -0.83, right: 0.83, bottom: 1.5, top: 3.5 };

function ZoneTooltip({
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
        <span>Location (side / ht)</span>
        <span className="text-right font-mono text-foreground">
          {p.plate_loc_side?.toFixed(2)} / {p.plate_loc_height?.toFixed(2)} ft
        </span>
      </div>
    </div>
  );
}

export function StrikeZoneChart({ pitches }: { pitches: Pitch[] }) {
  const byOutcome = React.useMemo(() => {
    const map = new Map<Outcome, Pitch[]>();
    for (const outcome of OUTCOME_ORDER) map.set(outcome, []);
    for (const p of pitches) {
      if (p.plate_loc_side === null || p.plate_loc_height === null) continue;
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
          dataKey="plate_loc_side"
          domain={[-3, 3]}
          label={{ value: "Plate Side (ft, catcher's view)", position: "bottom", fontSize: 11 }}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="plate_loc_height"
          domain={[0, 5]}
          label={{ value: "Plate Height (ft)", angle: -90, position: "insideLeft", fontSize: 11 }}
          tick={{ fontSize: 11 }}
        />
        <ReferenceArea
          x1={ZONE.left}
          x2={ZONE.right}
          y1={ZONE.bottom}
          y2={ZONE.top}
          stroke="var(--foreground)"
          fill="var(--foreground)"
          fillOpacity={0.04}
          strokeDasharray="4 4"
        />
        <Tooltip content={<ZoneTooltip />} cursor={{ strokeDasharray: "3 3" }} />
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

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SortableHead } from "@/components/explorer/sortable-head";
import { useSort } from "@/hooks/use-sort";
import { summarizeByPitcher, type PitcherSummaryRow } from "@/lib/stats";
import type { Pitch } from "@/lib/types";

function fmt(v: number | null, digits = 1, suffix = "") {
  return v === null ? "—" : `${v.toFixed(digits)}${suffix}`;
}

function pct(v: number | null) {
  return v === null ? "—" : `${(v * 100).toFixed(0)}%`;
}

export function PitcherLeaderboardTable({ pitches }: { pitches: Pitch[] }) {
  const rows = summarizeByPitcher(pitches);

  const { sorted, sortKey, sortDir, toggle } = useSort<PitcherSummaryRow>(
    rows,
    "pitches",
    (row, key) => row[key as keyof PitcherSummaryRow] as string | number | null
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Pitcher" sortKey="pitcher" activeKey={sortKey} dir={sortDir} onSort={toggle} />
          <SortableHead label="Throws" sortKey="throws" activeKey={sortKey} dir={sortDir} onSort={toggle} />
          <SortableHead label="Pitches" sortKey="pitches" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Pitch Types" sortKey="pitchTypes" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Velo" sortKey="avgRelSpeed" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Spin" sortKey="avgSpinRate" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Strike%" sortKey="strikeRate" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Whiff%" sortKey="whiffRate" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead
            label="Release Spread"
            sortKey="releaseConsistency"
            activeKey={sortKey}
            dir={sortDir}
            onSort={toggle}
            align="right"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row, i) => (
          <TableRow key={row.pitcherId} className={i === 0 ? "bg-accent/10" : undefined}>
            <TableCell className="font-medium">{row.pitcher}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="font-normal">
                {row.throws}
              </Badge>
            </TableCell>
            <TableCell className="text-right">{row.pitches}</TableCell>
            <TableCell className="text-right">{row.pitchTypes}</TableCell>
            <TableCell className="text-right">{fmt(row.avgRelSpeed, 1, " mph")}</TableCell>
            <TableCell className="text-right">{fmt(row.avgSpinRate, 0, " rpm")}</TableCell>
            <TableCell className="text-right">{pct(row.strikeRate)}</TableCell>
            <TableCell className="text-right">{pct(row.whiffRate)}</TableCell>
            <TableCell className="text-right">{fmt(row.releaseConsistency, 3, " ft")}</TableCell>
          </TableRow>
        ))}
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={9} className="text-center text-muted-foreground">
              No pitchers match the current filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHead } from "@/components/explorer/sortable-head";
import { OutcomeBadge } from "@/components/site/outcome-badge";
import { useSort } from "@/hooks/use-sort";
import { summarizeByOutcome, type OutcomeSummaryRow } from "@/lib/stats";
import type { Pitch } from "@/lib/types";

function fmt(v: number | null, digits = 2) {
  return v === null ? "—" : v.toFixed(digits);
}

export function OutcomeSummaryTable({ pitches }: { pitches: Pitch[] }) {
  const rows = summarizeByOutcome(pitches);

  const { sorted, sortKey, sortDir, toggle } = useSort<OutcomeSummaryRow>(
    rows,
    "count",
    (row, key) => row[key as keyof OutcomeSummaryRow] as string | number | null
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead label="Outcome" sortKey="outcome" activeKey={sortKey} dir={sortDir} onSort={toggle} />
          <SortableHead label="Pitches" sortKey="count" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Rel. Ht" sortKey="avgRelHeight" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Rel. Side" sortKey="avgRelSide" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Ext." sortKey="avgExtension" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Velo" sortKey="avgRelSpeed" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
          <SortableHead label="Avg Exit Velo" sortKey="avgExitSpeed" activeKey={sortKey} dir={sortDir} onSort={toggle} align="right" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.outcome}>
            <TableCell>
              <OutcomeBadge outcome={row.outcome} />
            </TableCell>
            <TableCell className="text-right">{row.count}</TableCell>
            <TableCell className="text-right">{fmt(row.avgRelHeight)} ft</TableCell>
            <TableCell className="text-right">{fmt(row.avgRelSide)} ft</TableCell>
            <TableCell className="text-right">{fmt(row.avgExtension)} ft</TableCell>
            <TableCell className="text-right">{fmt(row.avgRelSpeed, 1)} mph</TableCell>
            <TableCell className="text-right">{fmt(row.avgExitSpeed, 1)} mph</TableCell>
          </TableRow>
        ))}
        {sorted.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground">
              No pitches match the current filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

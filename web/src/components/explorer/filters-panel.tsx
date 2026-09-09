"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OUTCOME_COLORS } from "@/lib/outcomes";
import type { Outcome } from "@/lib/types";

interface FilterGroupProps<T extends string> {
  title: string;
  options: T[];
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  colorFor?: (value: T) => string | undefined;
}

function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onChange,
  colorFor,
}: FilterGroupProps<T>) {
  function toggle(value: T) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <div className="flex gap-2 text-[11px]">
          <button
            type="button"
            className="text-accent hover:underline"
            onClick={() => onChange(new Set(options))}
          >
            All
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:underline"
            onClick={() => onChange(new Set())}
          >
            None
          </button>
        </div>
      </div>
      <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
        {options.map((opt) => (
          <Label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 text-sm font-normal hover:bg-secondary"
          >
            <Checkbox checked={selected.has(opt)} onCheckedChange={() => toggle(opt)} />
            {colorFor?.(opt) && (
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorFor(opt) }}
              />
            )}
            <span className="truncate">{opt}</span>
          </Label>
        ))}
      </div>
    </div>
  );
}

export interface ExplorerFilters {
  pitchers: Set<string>;
  pitchTypes: Set<string>;
  outcomes: Set<Outcome>;
}

export function FiltersPanel({
  pitcherOptions,
  pitchTypeOptions,
  outcomeOptions,
  filters,
  onChange,
  resultCount,
  totalCount,
}: {
  pitcherOptions: string[];
  pitchTypeOptions: string[];
  outcomeOptions: Outcome[];
  filters: ExplorerFilters;
  onChange: (next: ExplorerFilters) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <Card className="py-4">
      <CardHeader className="flex-row items-center justify-between px-4">
        <CardTitle className="text-sm">Filters</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() =>
            onChange({
              pitchers: new Set(pitcherOptions),
              pitchTypes: new Set(pitchTypeOptions),
              outcomes: new Set(outcomeOptions),
            })
          }
        >
          Reset
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        <FilterGroup
          title="Pitcher"
          options={pitcherOptions}
          selected={filters.pitchers}
          onChange={(pitchers) => onChange({ ...filters, pitchers })}
        />
        <Separator />
        <FilterGroup
          title="Pitch Type"
          options={pitchTypeOptions}
          selected={filters.pitchTypes}
          onChange={(pitchTypes) => onChange({ ...filters, pitchTypes })}
        />
        <Separator />
        <FilterGroup
          title="Outcome"
          options={outcomeOptions}
          selected={filters.outcomes}
          onChange={(outcomes) => onChange({ ...filters, outcomes })}
          colorFor={(o) => OUTCOME_COLORS[o]}
        />
        <Separator />
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{resultCount}</span> of{" "}
          {totalCount} pitches
        </p>
      </CardContent>
    </Card>
  );
}

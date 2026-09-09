"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutcomeBadge } from "@/components/site/outcome-badge";
import { FiltersPanel, type ExplorerFilters } from "@/components/explorer/filters-panel";
import { ReleaseScatterChart } from "@/components/explorer/release-scatter-chart";
import { StrikeZoneChart } from "@/components/explorer/strike-zone-chart";
import { OutcomeSummaryTable } from "@/components/explorer/outcome-summary-table";
import { PitcherLeaderboardTable } from "@/components/explorer/pitcher-leaderboard-table";
import { OUTCOME_ORDER } from "@/lib/outcomes";
import { uniqueSorted } from "@/lib/stats";
import type { Outcome, Pitch } from "@/lib/types";

export function ExplorerClient({ pitches }: { pitches: Pitch[] }) {
  const pitcherOptions = React.useMemo(
    () => uniqueSorted(pitches.map((p) => p.pitcher_name)),
    [pitches]
  );
  const pitchTypeOptions = React.useMemo(
    () => uniqueSorted(pitches.map((p) => p.tagged_pitch_type).filter(Boolean)) as string[],
    [pitches]
  );
  const outcomeOptions = React.useMemo(
    () => OUTCOME_ORDER.filter((o) => pitches.some((p) => p.outcome === o)),
    [pitches]
  );

  const [filters, setFilters] = React.useState<ExplorerFilters>({
    pitchers: new Set(pitcherOptions),
    pitchTypes: new Set(pitchTypeOptions),
    outcomes: new Set(outcomeOptions),
  });

  const filtered = React.useMemo(
    () =>
      pitches.filter(
        (p) =>
          filters.pitchers.has(p.pitcher_name) &&
          filters.pitchTypes.has(p.tagged_pitch_type ?? "") &&
          filters.outcomes.has(p.outcome as Outcome)
      ),
    [pitches, filters]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <FiltersPanel
          pitcherOptions={pitcherOptions}
          pitchTypeOptions={pitchTypeOptions}
          outcomeOptions={outcomeOptions}
          filters={filters}
          onChange={setFilters}
          resultCount={filtered.length}
          totalCount={pitches.length}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Tabs defaultValue="release">
          <TabsList>
            <TabsTrigger value="release">Release Point</TabsTrigger>
            <TabsTrigger value="zone">Strike Zone</TabsTrigger>
            <TabsTrigger value="leaderboard">Pitcher Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="release" className="mt-4 flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Release point, colored by outcome</CardTitle>
                <CardDescription>
                  Each point is one pitch, positioned by release side &amp; height
                  (catcher&apos;s-eye view). Look for outcome colors clustering in
                  different regions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReleaseScatterChart pitches={filtered} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {outcomeOptions.map((o) => (
                    <OutcomeBadge key={o} outcome={o} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm">Release point &amp; velocity by outcome</CardTitle>
                <CardDescription>Click a column to sort.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <OutcomeSummaryTable pitches={filtered} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="zone" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pitch location vs. the strike zone</CardTitle>
                <CardDescription>
                  Catcher&apos;s-eye view of pitch locations, colored by outcome.
                  The dashed box is an approximate rulebook zone (17in plate,
                  ~1.5–3.5 ft vertically).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StrikeZoneChart pitches={filtered} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {outcomeOptions.map((o) => (
                    <OutcomeBadge key={o} outcome={o} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-4">
            <Card className="gap-3 py-4">
              <CardHeader className="px-4">
                <CardTitle className="text-sm">Pitcher leaderboard</CardTitle>
                <CardDescription>
                  Release-point consistency (lower spread = more repeatable
                  release), velocity, spin, and results, per pitcher. Click a
                  column to sort.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <PitcherLeaderboardTable pitches={filtered} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

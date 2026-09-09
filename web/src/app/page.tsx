import Link from "next/link";
import { ArrowRightIcon, DatabaseIcon, LineChartIcon, TableIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/site/stat-card";
import { OutcomeBadge } from "@/components/site/outcome-badge";
import { getPitches } from "@/lib/data";
import { summarizeByPitcher, uniqueSorted } from "@/lib/stats";
import { OUTCOME_ORDER } from "@/lib/outcomes";

export default async function HomePage() {
  const { pitches } = await getPitches();

  const pitcherCount = uniqueSorted(pitches.map((p) => p.pitcher_id)).length;
  const batterCount = uniqueSorted(pitches.map((p) => p.batter_id)).length;
  const pitchTypeCount = uniqueSorted(
    pitches.map((p) => p.tagged_pitch_type).filter(Boolean)
  ).length;

  const leaders = summarizeByPitcher(pitches)
    .sort((a, b) => b.pitches - a.pitches)
    .slice(0, 5);

  return (
    <div className="flex flex-col">
      {/* ---------------------------------------------------------------- */}
      {/* Hero */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit border-accent/40 bg-accent/15 text-accent">
              College baseball · TrackMan pitch tracking
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Does <span className="text-accent">where</span> a pitcher releases
              the ball relate to <span className="text-accent">what happens</span>{" "}
              to the pitch?
            </h1>
            <p className="max-w-xl text-sm text-primary-foreground/80 sm:text-base">
              FinchField Pitch Lab explores release point — height, side, and
              extension — against pitch outcomes for a real Coastal Plain
              League game. Filter by pitcher, pitch type, and result, and look
              for patterns a scouting report would miss.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:opacity-90">
                <Link href="/explorer">
                  Open the Explorer
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link href="/about">About the dataset</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <StatCard
              label="Pitches tracked"
              value={pitches.length}
              className="bg-white/5 text-primary-foreground [&_span]:text-primary-foreground [&_span:last-child]:text-primary-foreground/70"
            />
            <StatCard
              label="Pitchers"
              value={pitcherCount}
              className="bg-white/5 text-primary-foreground [&_span]:text-primary-foreground [&_span:last-child]:text-primary-foreground/70"
            />
            <StatCard
              label="Batters faced"
              value={batterCount}
              className="bg-white/5 text-primary-foreground [&_span]:text-primary-foreground [&_span:last-child]:text-primary-foreground/70"
            />
            <StatCard
              label="Pitch types"
              value={pitchTypeCount}
              className="bg-white/5 text-primary-foreground [&_span]:text-primary-foreground [&_span:last-child]:text-primary-foreground/70"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* How it works */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight">How the site works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <DatabaseIcon className="mb-1 size-5 text-accent" />
              <CardTitle>Raw TrackMan export → Supabase</CardTitle>
              <CardDescription>
                315 pitches from a 167-column TrackMan feed are normalized into
                games / pitchers / batters / pitches tables in Postgres, with
                RLS policies for public read access.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <LineChartIcon className="mb-1 size-5 text-accent" />
              <CardTitle>Release point vs. outcome</CardTitle>
              <CardDescription>
                Each pitch is plotted by release height &amp; side and colored
                by outcome — ball, called strike, whiff, foul, or contact — so
                clusters are easy to spot.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <TableIcon className="mb-1 size-5 text-accent" />
              <CardTitle>Sortable stat tables</CardTitle>
              <CardDescription>
                A pitcher leaderboard tracks release-point consistency, whiff
                rate, and strike rate side by side — sort any column, the way
                a scouting stat page would.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Leaderboard preview */}
      {/* ---------------------------------------------------------------- */}
      <section className="border-t bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Pitcher leaderboard, at a glance
            </h2>
            <Button asChild variant="link" className="px-0">
              <Link href="/explorer">
                Full explorer <ArrowRightIcon />
              </Link>
            </Button>
          </div>

          <Card className="mt-6 overflow-hidden py-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Pitcher
                    </th>
                    <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">
                      Throws
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Pitches
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Avg Velo
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Whiff%
                    </th>
                    <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide">
                      Release Spread (ft)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.map((p, i) => (
                    <tr
                      key={p.pitcherId}
                      className={i % 2 === 1 ? "bg-secondary/50" : undefined}
                    >
                      <td className="px-3 py-2 font-medium">{p.pitcher}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.throws}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.pitches}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.avgRelSpeed?.toFixed(1) ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.whiffRate !== null ? `${(p.whiffRate * 100).toFixed(0)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.releaseConsistency?.toFixed(3) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Outcomes legend */}
      {/* ---------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight">Outcome buckets used throughout</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          TrackMan&apos;s PitchCall / PlayResult fields are collapsed into eight
          readable buckets, shared by every chart and table on the site.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {OUTCOME_ORDER.map((o) => (
            <OutcomeBadge key={o} outcome={o} />
          ))}
        </div>
      </section>
    </div>
  );
}

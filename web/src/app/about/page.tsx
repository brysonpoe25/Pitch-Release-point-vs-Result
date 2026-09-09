import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GithubIcon } from "@/components/site/github-icon";

export const metadata: Metadata = {
  title: "About",
};

const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "Tailwind CSS v4",
  "shadcn/ui",
  "Recharts",
  "Supabase (Postgres)",
  "Vercel",
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">About this project</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        FinchField Pitch Lab is a small analytics site built around one
        question: <strong className="text-foreground">does where a pitcher
        releases the ball relate to what happens to the pitch?</strong> It
        started as a{" "}
        <Link href="https://streamlit.io/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
          Streamlit
        </Link>{" "}
        EDA notebook-style app and was rebuilt here as a full website on
        Next.js, shadcn/ui, and Supabase.
      </p>

      <Separator className="my-8" />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">The dataset</h2>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-secondary px-1 py-0.5 text-xs">data/pitch_data.csv</code>{" "}
          is a TrackMan pitch-by-pitch export from a college game at
          FinchField on <strong>June 9, 2025</strong> (Coastal Plain League):
          315 pitches, 8 pitchers, 20 batters faced, 6 pitch types. The raw
          export has 167 tracking columns; the site keeps the ~40 relevant to
          pitch/at-bat analysis — velocity, spin, movement, release point,
          location, and outcome.
        </p>
        <p className="text-xs text-muted-foreground/80">
          Note: the file is marked &ldquo;unverified&rdquo; by the source
          system — used here for educational analysis only.
        </p>
      </section>

      <Separator className="my-8" />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">From CSV to Supabase</h2>
        <Card className="gap-3 py-4">
          <CardContent className="grid gap-3 px-4 sm:grid-cols-3">
            <Step
              n={1}
              title="Normalize"
              body="scripts/build_data.py splits the flat CSV into games, pitchers, batters, and pitches, and buckets each pitch's PitchCall/PlayResult into 8 readable outcomes."
            />
            <Step
              n={2}
              title="Load"
              body="supabase/schema.sql defines the tables, views, and RLS policies; supabase/seed.sql (generated) inserts the normalized rows."
            />
            <Step
              n={3}
              title="Serve"
              body="The site reads from Supabase via the anon key when configured, falling back to a bundled JSON snapshot otherwise — so it always renders."
            />
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Schema</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SchemaCard
            title="games"
            desc="One row per TrackMan game export: date, stadium, teams."
          />
          <SchemaCard
            title="pitchers / batters"
            desc="Roster tables keyed by TrackMan's numeric IDs, with throws/side and team."
          />
          <SchemaCard
            title="pitches"
            desc="One row per pitch — release point, movement, location, and the derived outcome bucket. FKs to games/pitchers/batters."
          />
          <SchemaCard
            title="pitch_outcome_summary / pitcher_release_summary"
            desc="Views precomputing averages & release-point spread, so the client ships less JS."
          />
        </div>
      </section>

      <Separator className="my-8" />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Tech stack</h2>
        <div className="flex flex-wrap gap-2">
          {TECH_STACK.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
      </section>

      <Separator className="my-8" />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Links</h2>
        <Link
          href="https://github.com/brysonpoe25/pitch-release-point-vs-result"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm underline underline-offset-2"
        >
          <GithubIcon className="size-4" /> Source on GitHub
          <ExternalLinkIcon className="size-3" />
        </Link>
      </section>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {n}
      </span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{body}</span>
    </div>
  );
}

function SchemaCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="py-3">
      <CardHeader className="px-4">
        <CardTitle className="font-mono text-xs">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
    </Card>
  );
}

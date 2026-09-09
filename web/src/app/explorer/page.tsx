import type { Metadata } from "next";

import { ExplorerClient } from "@/components/explorer/explorer-client";
import { Badge } from "@/components/ui/badge";
import { getPitches } from "@/lib/data";

export const metadata: Metadata = {
  title: "Explorer",
};

export default async function ExplorerPage() {
  const { pitches, source } = await getPitches();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Pitch Explorer
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Filter by pitcher, pitch type, and outcome to explore how release
            point relates to what happens to the pitch.
          </p>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          Data source: {source === "supabase" ? "Supabase" : "static snapshot"}
        </Badge>
      </div>

      <ExplorerClient pitches={pitches} />
    </div>
  );
}

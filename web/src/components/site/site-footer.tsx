export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Data: TrackMan pitch-by-pitch export, FinchField, June 9 2025 (Coastal
          Plain League). Unverified game feed — for educational analysis only.
        </p>
        <p>Built with Next.js, shadcn/ui, Recharts &amp; Supabase.</p>
      </div>
    </footer>
  );
}

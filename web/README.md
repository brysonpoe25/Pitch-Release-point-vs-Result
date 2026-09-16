# FinchField Pitch Lab (web)

The Next.js site companion to the [Streamlit EDA app](../README.md) in this
repo — same question, same dataset, built as a deployable website on
**Next.js + shadcn/ui + Recharts + Supabase**, ready to host on **Vercel**.

> Does *where* a pitcher releases the ball relate to *what happens* to the
> pitch?

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — hand-copied under `src/components/ui`
  (see [Note on shadcn/ui](#note-on-shadcnui) below)
- [Recharts](https://recharts.org/) for the release-point / strike-zone
  scatter charts
- [Supabase](https://supabase.com/) (Postgres) for the dataset, with a
  bundled JSON snapshot as a fallback so the site works before Supabase is
  wired up
- [Vercel](https://vercel.com/) for hosting

## Run locally

```bash
cd web
npm install
npm run dev
```

Opens at `http://localhost:3000`. Without any Supabase env vars set, the
site reads from the bundled `src/data/pitches.json` snapshot automatically —
nothing else to configure for local dev.

## Release-Point Anomaly page (`/anomaly`)

A page that calls the deployed **Assignment 4** pipeline API (see
[`../api/`](../api)) — a fitted scikit-learn `Pipeline` served with FastAPI
on Modal, not a local mock. It shows the live artifact's metadata
(`GET /info`) and lets you score a pitch's release point against a
pitcher's learned baseline (`POST /score`).

`NEXT_PUBLIC_PIPELINE_API_URL` in `.env.local` / `.env.example` points at
the live Modal URL; `src/lib/pipeline-api.ts` also falls back to that same
URL if the env var is ever unset, so this page never silently talks to
localhost.

## Connecting Supabase (optional, for live data)

The site works out of the box on the static snapshot. To point it at a real
Supabase project instead:

1. Create a project at [supabase.com](https://supabase.com/).
2. In the Supabase SQL Editor, run `../supabase/schema.sql`, then
   `../supabase/seed.sql` (both generated/maintained at the repo root — see
   [`../supabase/`](../supabase)).
3. Copy `.env.example` to `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
   **Project Settings → API** in the Supabase dashboard.
4. Restart `npm run dev`. The badge on `/explorer` will read "Data source:
   Supabase" once it's picking up live data.

Re-running `python3 ../scripts/build_data.py` after editing
`data/pitch_data.csv` regenerates both `../supabase/seed.sql` and
`src/data/pitches.json`, so the live and static paths never drift apart.

## Deploying to Vercel

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. In [Vercel](https://vercel.com/), **Add New… → Project**, connect your
   GitHub account, and import this repository.
3. Set the **Root Directory** to `web` (this is a monorepo — the Next.js
   app lives in `web/`, not the repo root).
4. If you've set up Supabase (previous section), add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   Environment Variables in the project settings. Skip this to deploy on
   the static snapshot.
5. Add `NEXT_PUBLIC_PIPELINE_API_URL` (the deployed Modal URL from
   [`../api/README.md`](../api/README.md)) as an Environment Variable too —
   this is what the `/anomaly` page calls. It also has a hardcoded fallback
   to the same URL in `src/lib/pipeline-api.ts`, but setting it explicitly
   is the correct way to configure it.
6. Deploy. Vercel auto-detects Next.js — no build command changes needed.

## Project structure

```
web/
├── src/
│   ├── app/                 # routes: / (landing), /explorer, /about
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (button, card, table, chart, ...)
│   │   ├── site/              # header, footer, stat cards, outcome badges
│   │   └── explorer/          # filters, charts, sortable stat tables
│   ├── lib/                  # types, Supabase client, data loading, stats
│   ├── hooks/                 # useSort (client-side table sorting)
│   └── data/pitches.json      # bundled fallback snapshot (generated)
└── components.json           # shadcn/ui config (see note below)
```

## Note on shadcn/ui

This environment's network policy blocks `ui.shadcn.com`, which the
`shadcn` CLI needs to fetch component source. The primitives under
`src/components/ui/` were hand-written to match shadcn/ui's actual "new-york"
style output (same Radix UI + `class-variance-authority` + Tailwind
approach), and `components.json` is in place — so once you have `shadcn`
CLI access, `npx shadcn@latest add <component>` will work normally and
follow the existing conventions.

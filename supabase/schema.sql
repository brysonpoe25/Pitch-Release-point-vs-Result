-- =============================================================================
-- FinchField Pitch Tracking — Supabase schema
--
-- Normalizes the TrackMan pitch-by-pitch export (data/pitch_data.csv) into a
-- small relational model: one game, a roster of pitchers/batters, and one row
-- per pitch. Designed for a public, read-only analytics site — RLS is
-- enabled on every table with a single "anyone can read" policy and no
-- write access for the anon/authenticated roles (all writes happen via the
-- service role key from the seed script, server-side only).
--
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh
-- project before running `scripts/seed_supabase.py`.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- games — one row per TrackMan game export
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  game_id     text primary key,
  game_date   date not null,
  stadium     text,
  level       text,
  league      text,
  home_team   text,
  away_team   text,
  created_at  timestamptz not null default now()
);

comment on table public.games is 'One row per TrackMan game export (GameID).';

-- ---------------------------------------------------------------------------
-- pitchers — roster of pitchers seen across loaded games
-- ---------------------------------------------------------------------------
create table if not exists public.pitchers (
  pitcher_id  bigint primary key,
  name        text not null,
  throws      text check (throws in ('Left', 'Right', 'Undefined')),
  team        text,
  created_at  timestamptz not null default now()
);

comment on table public.pitchers is 'Distinct pitchers (PitcherId/Pitcher) across loaded games.';

-- ---------------------------------------------------------------------------
-- batters — roster of batters seen across loaded games
-- ---------------------------------------------------------------------------
create table if not exists public.batters (
  batter_id   bigint primary key,
  name        text not null,
  side        text check (side in ('Left', 'Right', 'Switch', 'Undefined')),
  team        text,
  created_at  timestamptz not null default now()
);

comment on table public.batters is 'Distinct batters (BatterId/Batter) across loaded games.';

-- ---------------------------------------------------------------------------
-- pitches — one row per pitch, the core analytical table
-- ---------------------------------------------------------------------------
create table if not exists public.pitches (
  pitch_uid           text primary key,              -- TrackMan PitchUID
  game_id             text not null references public.games (game_id) on delete cascade,
  pitch_no            integer,
  date                date,
  inning              integer,
  top_bottom          text,
  pa_of_inning        integer,
  pitch_of_pa         integer,
  outs                integer,
  balls               integer,
  strikes             integer,

  pitcher_id          bigint references public.pitchers (pitcher_id),
  batter_id           bigint references public.batters (batter_id),
  catcher_name        text,

  -- pitch classification
  tagged_pitch_type   text,
  auto_pitch_type     text,

  -- raw outcome fields from TrackMan
  pitch_call          text,
  kor_bb              text,
  tagged_hit_type     text,
  play_result         text,
  outs_on_play        integer,
  runs_scored         integer,

  -- collapsed, UI-friendly outcome bucket — see classify_outcome() below;
  -- stored (not generated) so it can be indexed and matches the same
  -- bucketing used by app.py and the Next.js site
  outcome             text not null check (outcome in (
                         'Ball', 'Called Strike', 'Swinging Strike', 'Foul',
                         'Hit By Pitch', 'In Play: Out', 'In Play: Hit',
                         'In Play: Other', 'Other'
                       )),

  -- release point & pitch characteristics
  rel_speed           numeric,
  vert_rel_angle      numeric,
  horz_rel_angle      numeric,
  spin_rate           numeric,
  spin_axis           numeric,
  rel_height          numeric,
  rel_side            numeric,
  extension           numeric,

  -- movement
  vert_break          numeric,
  induced_vert_break  numeric,
  horz_break          numeric,

  -- location at plate
  plate_loc_height    numeric,
  plate_loc_side      numeric,
  zone_speed          numeric,
  vert_appr_angle     numeric,
  horz_appr_angle     numeric,
  effective_velo      numeric,

  -- contact quality (balls in play only)
  exit_speed          numeric,
  angle               numeric,
  direction           numeric,
  distance            numeric,

  created_at          timestamptz not null default now()
);

comment on table public.pitches is 'One row per pitch, trimmed to the ~30 tracking columns relevant to release-point-vs-outcome analysis.';

create index if not exists pitches_pitcher_id_idx        on public.pitches (pitcher_id);
create index if not exists pitches_batter_id_idx         on public.pitches (batter_id);
create index if not exists pitches_game_id_idx           on public.pitches (game_id);
create index if not exists pitches_outcome_idx           on public.pitches (outcome);
create index if not exists pitches_tagged_pitch_type_idx on public.pitches (tagged_pitch_type);

-- ---------------------------------------------------------------------------
-- Views — precomputed aggregates for the dashboard, so the client ships
-- less JS and the "does release point relate to outcome" question can be
-- answered with a single query.
-- ---------------------------------------------------------------------------

create or replace view public.pitch_outcome_summary as
select
  outcome,
  count(*)                                    as pitch_count,
  round(avg(rel_height)::numeric, 3)          as avg_rel_height,
  round(avg(rel_side)::numeric, 3)            as avg_rel_side,
  round(avg(extension)::numeric, 3)           as avg_extension,
  round(avg(rel_speed)::numeric, 2)           as avg_rel_speed,
  round(avg(exit_speed)::numeric, 2)          as avg_exit_speed
from public.pitches
group by outcome;

comment on view public.pitch_outcome_summary is 'Average release point / velocity / exit speed by outcome bucket.';

create or replace view public.pitcher_release_summary as
select
  p.pitcher_id,
  pt.name                                     as pitcher_name,
  pt.throws,
  p.tagged_pitch_type,
  count(*)                                    as pitch_count,
  round(avg(p.rel_height)::numeric, 3)        as avg_rel_height,
  round(avg(p.rel_side)::numeric, 3)          as avg_rel_side,
  round(stddev(p.rel_height)::numeric, 3)     as stddev_rel_height,
  round(stddev(p.rel_side)::numeric, 3)       as stddev_rel_side,
  round(avg(p.extension)::numeric, 3)         as avg_extension,
  round(avg(p.rel_speed)::numeric, 2)         as avg_rel_speed,
  round(avg(p.spin_rate)::numeric, 0)         as avg_spin_rate
from public.pitches p
join public.pitchers pt using (pitcher_id)
group by p.pitcher_id, pt.name, pt.throws, p.tagged_pitch_type;

comment on view public.pitcher_release_summary is 'Per pitcher x pitch-type release-point consistency (mean + stddev) and velo/spin.';

-- ---------------------------------------------------------------------------
-- Row Level Security — public, read-only dataset
-- ---------------------------------------------------------------------------
alter table public.games    enable row level security;
alter table public.pitchers enable row level security;
alter table public.batters  enable row level security;
alter table public.pitches  enable row level security;

drop policy if exists "public read games"    on public.games;
drop policy if exists "public read pitchers" on public.pitchers;
drop policy if exists "public read batters"  on public.batters;
drop policy if exists "public read pitches"  on public.pitches;

create policy "public read games"    on public.games    for select using (true);
create policy "public read pitchers" on public.pitchers for select using (true);
create policy "public read batters"  on public.batters  for select using (true);
create policy "public read pitches"  on public.pitches  for select using (true);

-- No insert/update/delete policies are defined for anon/authenticated —
-- writes are only ever performed by scripts/seed_supabase.py using the
-- service role key, which bypasses RLS.

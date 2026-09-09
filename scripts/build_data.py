#!/usr/bin/env python3
"""
Transform data/pitch_data.csv (raw TrackMan export) into:

  1. supabase/seed.sql        — INSERT statements for games/pitchers/batters/
                                 pitches. Paste into the Supabase SQL editor
                                 (after schema.sql) to load the dataset, or
                                 run via `psql "$SUPABASE_DB_URL" -f seed.sql`.
  2. web/src/data/pitches.json — a bundled static snapshot the Next.js site
                                 reads from when NEXT_PUBLIC_SUPABASE_URL is
                                 not configured, so the deployed demo works
                                 before Supabase is wired up.

Pure stdlib (csv/json) — no extra dependencies. Mirrors the outcome
bucketing in app.py's classify_outcome() so the Streamlit app, the seed
data, and the website all agree on what "Ball" / "Swinging Strike" / etc.
mean.

Usage:
    python3 scripts/build_data.py
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_CSV = ROOT / "data" / "pitch_data.csv"
SEED_SQL = ROOT / "supabase" / "seed.sql"
PITCHES_JSON = ROOT / "web" / "src" / "data" / "pitches.json"

OUTCOME_ORDER = [
    "Ball", "Called Strike", "Swinging Strike", "Foul", "Hit By Pitch",
    "In Play: Out", "In Play: Hit", "In Play: Other",
]


def classify_outcome(row: dict) -> str:
    call = row["PitchCall"]
    if call == "BallCalled":
        return "Ball"
    if call == "StrikeCalled":
        return "Called Strike"
    if call == "StrikeSwinging":
        return "Swinging Strike"
    if call in ("FoulBallNotFieldable", "FoulBallFieldable"):
        return "Foul"
    if call == "HitByPitch":
        return "Hit By Pitch"
    if call == "InPlay":
        result = row["PlayResult"]
        if result in ("Single", "Double", "Triple", "HomeRun"):
            return "In Play: Hit"
        if result == "Out":
            return "In Play: Out"
        return "In Play: Other"
    return "Other"


def num(row: dict, key: str):
    v = row.get(key, "")
    if v is None or v == "":
        return None
    try:
        f = float(v)
    except ValueError:
        return None
    # collapse -0.0 and keep ints as ints for cleaner JSON/SQL
    if f.is_integer():
        return int(f)
    return round(f, 4)


def intval(row: dict, key: str):
    v = row.get(key, "")
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except ValueError:
        return None


def sql_str(v) -> str:
    if v is None:
        return "null"
    return "'" + str(v).replace("'", "''") + "'"


def sql_num(v) -> str:
    return "null" if v is None else str(v)


def main() -> None:
    if not SRC_CSV.exists():
        raise SystemExit(f"missing {SRC_CSV}")

    with SRC_CSV.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    games: dict[str, dict] = {}
    pitchers: dict[str, dict] = {}
    batters: dict[str, dict] = {}
    pitches: list[dict] = []

    # A handful of rows in the raw export are missing BatterId (TrackMan
    # dropped the roster lookup for that plate appearance) even though the
    # batter's name is present. Assign small negative synthetic IDs, keyed
    # by name, so those rows still join to a batter instead of being
    # dropped or crashing the load.
    synthetic_batter_ids: dict[str, int] = {}

    def resolve_batter_id(name: str, raw_id: str) -> int:
        if raw_id:
            return int(raw_id)
        if name not in synthetic_batter_ids:
            synthetic_batter_ids[name] = -(len(synthetic_batter_ids) + 1)
        return synthetic_batter_ids[name]

    for row in rows:
        game_id = row["GameID"]
        games.setdefault(
            game_id,
            {
                "game_id": game_id,
                "game_date": row["Date"],
                "stadium": row.get("Stadium") or None,
                "level": row.get("Level") or None,
                "league": row.get("League") or None,
                "home_team": row.get("HomeTeam") or None,
                "away_team": row.get("AwayTeam") or None,
            },
        )

        pid = row["PitcherId"]
        pitchers.setdefault(
            pid,
            {
                "pitcher_id": int(pid),
                "name": row["Pitcher"],
                "throws": row.get("PitcherThrows") or "Undefined",
                "team": row.get("PitcherTeam") or None,
            },
        )

        bid = resolve_batter_id(row["Batter"], row["BatterId"])
        batters.setdefault(
            bid,
            {
                "batter_id": bid,
                "name": row["Batter"],
                "side": row.get("BatterSide") or "Undefined",
                "team": row.get("BatterTeam") or None,
            },
        )

        outcome = classify_outcome(row)

        pitches.append(
            {
                "pitch_uid": row["PitchUID"],
                "game_id": game_id,
                "pitch_no": intval(row, "PitchNo"),
                "date": row["Date"],
                "inning": intval(row, "Inning"),
                "top_bottom": row.get("Top/Bottom") or None,
                "pa_of_inning": intval(row, "PAofInning"),
                "pitch_of_pa": intval(row, "PitchofPA"),
                "outs": intval(row, "Outs"),
                "balls": intval(row, "Balls"),
                "strikes": intval(row, "Strikes"),
                "pitcher_id": int(pid),
                "pitcher_name": row["Pitcher"],
                "pitcher_throws": row.get("PitcherThrows") or "Undefined",
                "batter_id": bid,
                "batter_name": row["Batter"],
                "batter_side": row.get("BatterSide") or "Undefined",
                "catcher_name": row.get("Catcher") or None,
                "tagged_pitch_type": row.get("TaggedPitchType") or None,
                "auto_pitch_type": row.get("AutoPitchType") or None,
                "pitch_call": row.get("PitchCall") or None,
                "kor_bb": row.get("KorBB") or None,
                "tagged_hit_type": row.get("TaggedHitType") or None,
                "play_result": row.get("PlayResult") or None,
                "outs_on_play": intval(row, "OutsOnPlay"),
                "runs_scored": intval(row, "RunsScored"),
                "outcome": outcome,
                "rel_speed": num(row, "RelSpeed"),
                "vert_rel_angle": num(row, "VertRelAngle"),
                "horz_rel_angle": num(row, "HorzRelAngle"),
                "spin_rate": num(row, "SpinRate"),
                "spin_axis": num(row, "SpinAxis"),
                "rel_height": num(row, "RelHeight"),
                "rel_side": num(row, "RelSide"),
                "extension": num(row, "Extension"),
                "vert_break": num(row, "VertBreak"),
                "induced_vert_break": num(row, "InducedVertBreak"),
                "horz_break": num(row, "HorzBreak"),
                "plate_loc_height": num(row, "PlateLocHeight"),
                "plate_loc_side": num(row, "PlateLocSide"),
                "zone_speed": num(row, "ZoneSpeed"),
                "vert_appr_angle": num(row, "VertApprAngle"),
                "horz_appr_angle": num(row, "HorzApprAngle"),
                "effective_velo": num(row, "EffectiveVelo"),
                "exit_speed": num(row, "ExitSpeed"),
                "angle": num(row, "Angle"),
                "direction": num(row, "Direction"),
                "distance": num(row, "Distance"),
            }
        )

    # ---- write JSON snapshot (bundled fallback dataset for the website) ----
    PITCHES_JSON.parent.mkdir(parents=True, exist_ok=True)
    PITCHES_JSON.write_text(json.dumps(pitches, indent=0), encoding="utf-8")

    # ---- write Supabase seed.sql ----
    lines: list[str] = [
        "-- Auto-generated by scripts/build_data.py — do not edit by hand.",
        "-- Loads data/pitch_data.csv into the schema defined in schema.sql.",
        "begin;",
        "",
    ]

    lines.append("insert into public.games (game_id, game_date, stadium, level, league, home_team, away_team) values")
    lines.append(
        ",\n".join(
            f"  ({sql_str(g['game_id'])}, {sql_str(g['game_date'])}, {sql_str(g['stadium'])}, "
            f"{sql_str(g['level'])}, {sql_str(g['league'])}, {sql_str(g['home_team'])}, {sql_str(g['away_team'])})"
            for g in games.values()
        )
    )
    lines.append("on conflict (game_id) do nothing;\n")

    lines.append("insert into public.pitchers (pitcher_id, name, throws, team) values")
    lines.append(
        ",\n".join(
            f"  ({p['pitcher_id']}, {sql_str(p['name'])}, {sql_str(p['throws'])}, {sql_str(p['team'])})"
            for p in pitchers.values()
        )
    )
    lines.append("on conflict (pitcher_id) do nothing;\n")

    lines.append("insert into public.batters (batter_id, name, side, team) values")
    lines.append(
        ",\n".join(
            f"  ({b['batter_id']}, {sql_str(b['name'])}, {sql_str(b['side'])}, {sql_str(b['team'])})"
            for b in batters.values()
        )
    )
    lines.append("on conflict (batter_id) do nothing;\n")

    pitch_cols = [
        "pitch_uid", "game_id", "pitch_no", "date", "inning", "top_bottom",
        "pa_of_inning", "pitch_of_pa", "outs", "balls", "strikes",
        "pitcher_id", "batter_id", "catcher_name",
        "tagged_pitch_type", "auto_pitch_type",
        "pitch_call", "kor_bb", "tagged_hit_type", "play_result",
        "outs_on_play", "runs_scored", "outcome",
        "rel_speed", "vert_rel_angle", "horz_rel_angle", "spin_rate", "spin_axis",
        "rel_height", "rel_side", "extension",
        "vert_break", "induced_vert_break", "horz_break",
        "plate_loc_height", "plate_loc_side", "zone_speed",
        "vert_appr_angle", "horz_appr_angle", "effective_velo",
        "exit_speed", "angle", "direction", "distance",
    ]
    str_cols = {
        "pitch_uid", "game_id", "date", "top_bottom", "catcher_name",
        "tagged_pitch_type", "auto_pitch_type", "pitch_call", "kor_bb",
        "tagged_hit_type", "play_result", "outcome",
    }

    lines.append(f"insert into public.pitches ({', '.join(pitch_cols)}) values")
    row_sql = []
    for p in pitches:
        vals = []
        for c in pitch_cols:
            v = p[c]
            vals.append(sql_str(v) if c in str_cols else sql_num(v))
        row_sql.append(f"  ({', '.join(vals)})")
    lines.append(",\n".join(row_sql))
    lines.append("on conflict (pitch_uid) do nothing;\n")

    lines.append("commit;")

    SEED_SQL.parent.mkdir(parents=True, exist_ok=True)
    SEED_SQL.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"wrote {len(pitches)} pitches, {len(pitchers)} pitchers, "
          f"{len(batters)} batters, {len(games)} game(s)")
    print(f"  -> {SEED_SQL.relative_to(ROOT)}")
    print(f"  -> {PITCHES_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

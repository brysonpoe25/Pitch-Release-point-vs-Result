export type Outcome =
  | "Ball"
  | "Called Strike"
  | "Swinging Strike"
  | "Foul"
  | "Hit By Pitch"
  | "In Play: Out"
  | "In Play: Hit"
  | "In Play: Other"
  | "Other";

export interface Pitch {
  pitch_uid: string;
  game_id: string;
  pitch_no: number | null;
  date: string;
  inning: number | null;
  top_bottom: string | null;
  pa_of_inning: number | null;
  pitch_of_pa: number | null;
  outs: number | null;
  balls: number | null;
  strikes: number | null;

  pitcher_id: number;
  pitcher_name: string;
  pitcher_throws: string;

  batter_id: number;
  batter_name: string;
  batter_side: string;

  catcher_name: string | null;

  tagged_pitch_type: string | null;
  auto_pitch_type: string | null;

  pitch_call: string | null;
  kor_bb: string | null;
  tagged_hit_type: string | null;
  play_result: string | null;
  outs_on_play: number | null;
  runs_scored: number | null;

  outcome: Outcome;

  rel_speed: number | null;
  vert_rel_angle: number | null;
  horz_rel_angle: number | null;
  spin_rate: number | null;
  spin_axis: number | null;
  rel_height: number | null;
  rel_side: number | null;
  extension: number | null;

  vert_break: number | null;
  induced_vert_break: number | null;
  horz_break: number | null;

  plate_loc_height: number | null;
  plate_loc_side: number | null;
  zone_speed: number | null;
  vert_appr_angle: number | null;
  horz_appr_angle: number | null;
  effective_velo: number | null;

  exit_speed: number | null;
  angle: number | null;
  direction: number | null;
  distance: number | null;
}

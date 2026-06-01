/**
 * Database types. In production, regenerate with:
 *   supabase gen types typescript --linked > src/types/database.ts
 * This hand-written version mirrors supabase/migrations/0001_init.sql so the
 * scaffold type-checks before you connect a project.
 */

export type PoolRole = "owner" | "admin" | "member";
export type Stage =
  | "group" | "round_of_32" | "round_of_16" | "quarter_final" | "semi_final" | "final";
export type FixtureStatus =
  | "scheduled" | "live" | "halftime" | "finished" | "postponed" | "cancelled";
export type PredictionType =
  | "match_winner" | "exact_score" | "over_under" | "both_teams_to_score" | "qualification";
export type DraftStatus = "pending" | "live" | "paused" | "complete";
export type NotificationKind =
  | "draft_reminder" | "prediction_reminder" | "score_event" | "rivalry_alert"
  | "team_plays_soon" | "leaderboard_move" | "upset_alert" | "announcement";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

interface Table<Row> {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
}

export interface Database {
  public: {
    Tables: {
      users: Table<{
        id: string; email: string; nickname: string; bio: string | null;
        avatar_url: string | null; favorite_team_id: string | null;
        reputation: number; created_at: string; updated_at: string;
      }>;
      tournaments: Table<{
        id: string; slug: string; name: string; sport: string; season: string | null;
        starts_at: string | null; ends_at: string | null; config: Json;
        provider_ref: Json; is_active: boolean; created_at: string;
      }>;
      teams: Table<{
        id: string; tournament_id: string; name: string; short_code: string | null;
        flag_url: string | null; group_label: string | null; seed: number | null;
        provider_id: string | null; created_at: string;
      }>;
      fixtures: Table<{
        id: string; tournament_id: string; stage: Stage; matchweek: number | null;
        kickoff_at: string; status: FixtureStatus; home_team_id: string | null;
        away_team_id: string | null; home_score: number | null; away_score: number | null;
        minute: number | null; provider_id: string | null; stats: Json;
        updated_at: string; created_at: string;
      }>;
      pools: Table<{
        id: string; tournament_id: string; owner_id: string; name: string;
        image_url: string | null; banner_url: string | null; is_public: boolean;
        max_members: number; teams_per_user: number; draft_at: string | null;
        draft_status: DraftStatus; scoring_config: Json; prediction_config: Json;
        knockout_multiplier: boolean; prize_description: string | null; created_at: string;
      }>;
      pool_members: Table<{
        id: string; pool_id: string; user_id: string; role: PoolRole;
        draft_position: number | null; joined_at: string;
      }>;
      invite_codes: Table<{
        id: string; pool_id: string; code: string; created_by: string | null;
        max_uses: number | null; uses: number; expires_at: string | null; created_at: string;
      }>;
      drafted_teams: Table<{
        id: string; pool_id: string; user_id: string; team_id: string;
        pick_number: number; picked_at: string;
      }>;
      weekly_predictions: Table<{
        id: string; pool_id: string; fixture_id: string | null; matchweek: number;
        stage: Stage; type: PredictionType; prompt: string; locks_at: string;
        correct_option_id: string | null; created_by: string | null; created_at: string;
      }>;
      prediction_options: Table<{
        id: string; prediction_id: string; label: string; value: string; sort_order: number;
      }>;
      user_prediction_entries: Table<{
        id: string; prediction_id: string; user_id: string; option_id: string;
        is_correct: boolean | null; points_awarded: number; submitted_at: string;
      }>;
      scores: Table<{
        id: string; pool_id: string; user_id: string; fixture_id: string | null;
        source: string; team_id: string | null; points: number; reason: string | null;
        created_at: string;
      }>;
      standings: Table<{
        id: string; pool_id: string; user_id: string; total_points: number;
        prediction_points: number; team_points: number; rank: number | null;
        previous_rank: number | null; updated_at: string;
      }>;
      achievements: Table<{
        id: string; user_id: string; pool_id: string | null; code: string;
        label: string; description: string | null; awarded_at: string;
      }>;
      rivalries: Table<{
        id: string; pool_id: string; user_a: string; user_b: string; name: string;
        stats: Json; intensity: number; created_at: string;
      }>;
      stories: Table<{
        id: string; pool_id: string; subject_user: string | null; kind: string;
        headline: string; body: string | null; payload: Json; created_at: string;
      }>;
      announcements: Table<{
        id: string; pool_id: string; author_id: string | null; title: string;
        body: string; is_poll: boolean; poll_options: Json; created_at: string;
      }>;
      chat_messages: Table<{
        id: string; pool_id: string; user_id: string; body: string;
        reply_to: string | null; created_at: string;
      }>;
      reactions: Table<{
        id: string; message_id: string; user_id: string; emoji: string; created_at: string;
      }>;
      notifications: Table<{
        id: string; user_id: string; pool_id: string | null; kind: NotificationKind;
        title: string; body: string | null; link: string | null; is_read: boolean; created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      pool_role: PoolRole; tournament_stage: Stage; fixture_status: FixtureStatus;
      prediction_type: PredictionType; draft_status: DraftStatus; notification_kind: NotificationKind;
    };
  };
}

/**
 * Tournament engine — domain types.
 * Deliberately independent of FIFA, Supabase, and React. The engine consumes
 * plain data and a `TournamentConfig`, so adding Euros/AFCON/UCL is config-only.
 */

export type Stage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

export type FixtureStatus =
  | "scheduled"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

export type PredictionType =
  | "match_winner"
  | "exact_score"
  | "over_under"
  | "both_teams_to_score"
  | "qualification";

export interface Team {
  id: string;
  name: string;
  shortCode: string | null;
  flagUrl: string | null;
  groupLabel: string | null;
}

export interface Fixture {
  id: string;
  stage: Stage;
  matchweek: number | null;
  kickoffAt: string; // ISO
  status: FixtureStatus;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
}

/** Points a team earns per group-stage result. */
export interface GroupRules {
  win: number;
  draw: number;
  loss: number;
}

/** Bonus points for reaching each knockout round (and winning). */
export interface ProgressionRules {
  round_of_32: number;
  round_of_16: number;
  quarter_final: number;
  semi_final: number;
  final: number;
  winner: number;
}

/** Prediction points by the stage the prediction belongs to. */
export interface PredictionRules {
  group: number;
  round_of_32: number;
  round_of_16: number;
  quarter_final: number;
  semi_final: number;
  final: number;
}

export interface TournamentConfig {
  groupStage: GroupRules;
  progression: ProgressionRules;
  prediction: PredictionRules;
  /** If true, knockout team points (group results in KO stages) are doubled. */
  knockoutMultiplier: boolean;
  groups: string[];
}

/** A drafted team belonging to a pool member. */
export interface RosterEntry {
  userId: string;
  teamId: string;
}

/** Result of evaluating one fixture for one team. */
export interface ScoreEvent {
  userId: string;
  teamId: string;
  fixtureId: string | null;
  source: "team_result" | "progression" | "prediction";
  points: number;
  reason: string;
}

export interface StandingRow {
  userId: string;
  totalPoints: number;
  teamPoints: number;
  predictionPoints: number;
  rank: number;
  previousRank: number | null;
}

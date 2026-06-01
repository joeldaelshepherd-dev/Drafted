/**
 * "My Teams" dashboard — view-model types.
 * Built by a pure function from engine primitives so it stays tournament-agnostic
 * (works for any TournamentConfig) and renders identically online or from demo data.
 */
import type { Fixture, Stage, Team } from "@/lib/tournament/types";

export interface PoolMemberLite {
  userId: string;
  name: string;
  avatarUrl?: string | null;
}

/** A drafted team belonging to some pool member. */
export interface RosterPick {
  userId: string;
  teamId: string;
}

/** Optional per-team metadata an admin/provider can supply. */
export interface TeamMeta {
  fifaRanking?: number | null;
  /** Hard elimination flag (admin/provider override). */
  eliminated?: boolean;
  /** 0–1 chance of advancing from the group, if known. */
  qualificationProbability?: number | null;
}

export type OpponentOwnerKind = "member" | "self" | "none";

export interface OpponentOwnership {
  kind: OpponentOwnerKind;
  member?: PoolMemberLite | null;
  /** Human label: "Owned by Murray" | "Civil war matchup" | "No owner". */
  label: string;
}

export interface OwnedFixture {
  fixture: Fixture;
  isHome: boolean;
  opponent: Team | null;
  ownership: OpponentOwnership;
}

export interface LiveContext {
  fixture: Fixture;
  isHome: boolean;
  opponent: Team | null;
  /** Points this team banks if the current scoreline holds. */
  pointsIfHolds: number;
  /** "+3 points if result holds" style caption. */
  caption: string;
}

export interface MyTeamCard {
  team: Team;
  fifaRanking: number | null;
  /** Confirmed points from finished results. */
  points: number;
  /** Confirmed + live "if it holds" points. */
  projectedPoints: number;
  record: { w: number; d: number; l: number };
  /** Highest stage this team has appeared in. */
  stage: Stage;
  progressionLabel: string;
  eliminated: boolean;
  qualificationProbability: number | null;
  upcoming: OwnedFixture | null;
  live: LiveContext | null;
  /** One short, human insight ("Best performer", "On a 2-game streak"). */
  insight: string | null;
}

export interface RivalryContext {
  rival: PoolMemberLite;
  /** Positive = you lead by N, negative = you trail by N. */
  gap: number;
}

export interface MyTeamsSummary {
  totalPoints: number;
  projectedPoints: number;
  activeTeams: number;
  eliminatedTeams: number;
  /** Soonest kickoff among owned teams, if any. */
  nextKickoffAt: string | null;
  nextKickoffTeam: Team | null;
  closestRivalry: RivalryContext | null;
  /** Max points the owned teams could add in the current matchweek. */
  potentialPointsThisWeek: number;
}

export interface MyTeamsView {
  summary: MyTeamsSummary;
  cards: MyTeamCard[];
  liveHighlight: LiveContext | null;
}

export interface BuildMyTeamsInput {
  currentUserId: string;
  teams: Team[];
  fixtures: Fixture[];
  roster: RosterPick[];
  members: PoolMemberLite[];
  teamMeta?: Record<string, TeamMeta>;
}

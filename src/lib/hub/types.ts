/**
 * Tournament Hub types — a NEUTRAL, pool-independent view of the competition.
 *
 * Distinct from the pool scoring engine (src/lib/tournament): the hub is the
 * "official companion app" — real schedule, group tables, and bracket — with no
 * concept of pool points or ownership.
 */
import type { Stage } from "@/lib/tournament/types";

export type HubFixtureStatus = "upcoming" | "live" | "completed";

export interface HubFixture {
  id: string;
  stage: Stage;
  /** Group letter for group-stage matches; null in the knockouts. */
  groupLabel: string | null;
  /** Group matchday 1–3 (group stage only). */
  matchday: number;
  venue: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: HubFixtureStatus;
  minute: number | null;
}

export interface GroupTableRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface GroupTable {
  group: string;
  rows: GroupTableRow[];
}

export interface BracketSlot {
  /** Resolved qualifier, or null until the group stage decides it. */
  teamId: string | null;
  /** Human label, e.g. "Winners A" / "Runners-up B" / "3rd Group C". */
  label: string;
}

export interface BracketMatch {
  id: string;
  stage: Stage;
  home: BracketSlot;
  away: BracketSlot;
  homeScore: number | null;
  awayScore: number | null;
}

export interface BracketRound {
  stage: Stage;
  label: string;
  matches: BracketMatch[];
}

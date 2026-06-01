import type { FixtureStatus, Stage } from "@/lib/tournament/types";

/**
 * Provider-agnostic football data contract. Adapters (API-Football, mock, and
 * future Sportmonks / Football-Data.org) implement this; the rest of the app
 * never imports a vendor SDK directly.
 */

export interface ProviderTeam {
  providerId: string;
  name: string;
  shortCode: string | null;
  flagUrl: string | null;
  groupLabel: string | null;
}

export interface ProviderFixture {
  providerId: string;
  stage: Stage;
  matchweek: number | null;
  kickoffAt: string; // ISO
  status: FixtureStatus;
  homeProviderId: string | null;
  awayProviderId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  goalScorers?: { team: "home" | "away"; player: string; minute: number }[];
}

export interface ProviderStanding {
  teamProviderId: string;
  groupLabel: string;
  rank: number;
  played: number;
  points: number;
}

export interface TournamentRef {
  leagueId: number | string;
  season: number | string;
}

export interface FootballProvider {
  readonly name: string;
  getTeams(ref: TournamentRef): Promise<ProviderTeam[]>;
  getFixtures(ref: TournamentRef): Promise<ProviderFixture[]>;
  getLiveFixtures(ref: TournamentRef): Promise<ProviderFixture[]>;
  getStandings(ref: TournamentRef): Promise<ProviderStanding[]>;
}

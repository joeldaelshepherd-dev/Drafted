import type {
  FootballProvider,
  ProviderFixture,
  ProviderStanding,
  ProviderTeam,
  TournamentRef,
} from "./types";

/**
 * Offline provider. Lets the whole app run with NO API key — handy for local
 * dev, CI, and demos. Returns a small slice mirroring the SQL seed, and nudges
 * the live Spain–Japan fixture's clock forward each call so "live" feels alive.
 */
const liveStartedAt = Date.now();

const TEAMS: ProviderTeam[] = [
  { providerId: "esp", name: "Spain", shortCode: "ESP", flagUrl: "https://flagcdn.com/es.svg", groupLabel: "E" },
  { providerId: "jpn", name: "Japan", shortCode: "JPN", flagUrl: "https://flagcdn.com/jp.svg", groupLabel: "E" },
  { providerId: "bra", name: "Brazil", shortCode: "BRA", flagUrl: "https://flagcdn.com/br.svg", groupLabel: "G" },
  { providerId: "arg", name: "Argentina", shortCode: "ARG", flagUrl: "https://flagcdn.com/ar.svg", groupLabel: "C" },
  { providerId: "fra", name: "France", shortCode: "FRA", flagUrl: "https://flagcdn.com/fr.svg", groupLabel: "D" },
];

export class MockProvider implements FootballProvider {
  readonly name = "mock";

  async getTeams(): Promise<ProviderTeam[]> {
    return TEAMS;
  }

  async getFixtures(_ref: TournamentRef): Promise<ProviderFixture[]> {
    return [
      { providerId: "m1", stage: "group", matchweek: 1, kickoffAt: "2026-06-11T18:00:00Z", status: "finished", homeProviderId: "arg", awayProviderId: null, homeScore: 2, awayScore: 1, minute: 90 },
      { providerId: "m2", stage: "group", matchweek: 1, kickoffAt: "2026-06-11T21:00:00Z", status: "finished", homeProviderId: "fra", awayProviderId: null, homeScore: 2, awayScore: 0, minute: 90 },
      ...(await this.getLiveFixtures(_ref)),
    ];
  }

  async getLiveFixtures(_ref: TournamentRef): Promise<ProviderFixture[]> {
    const minute = Math.min(90, 67 + Math.floor((Date.now() - liveStartedAt) / 60000));
    return [
      {
        providerId: "m_live",
        stage: "group",
        matchweek: 1,
        kickoffAt: "2026-06-12T21:00:00Z",
        status: minute >= 90 ? "finished" : "live",
        homeProviderId: "esp",
        awayProviderId: "jpn",
        homeScore: 1,
        awayScore: 0,
        minute,
      },
    ];
  }

  async getStandings(): Promise<ProviderStanding[]> {
    return [
      { teamProviderId: "esp", groupLabel: "E", rank: 1, played: 1, points: 3 },
      { teamProviderId: "jpn", groupLabel: "E", rank: 4, played: 1, points: 0 },
    ];
  }
}

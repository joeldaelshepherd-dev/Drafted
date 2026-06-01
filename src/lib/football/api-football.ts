import type { FixtureStatus, Stage } from "@/lib/tournament/types";
import { apiFootballLimiter, cached } from "./cache";
import type {
  FootballProvider,
  ProviderFixture,
  ProviderStanding,
  ProviderTeam,
  TournamentRef,
} from "./types";

/**
 * API-Football (v3) adapter — the primary live-data provider.
 * Docs: https://www.api-football.com/documentation-v3
 *
 * Auth: header `x-apisports-key`. Endpoints used: /teams, /fixtures,
 * /fixtures?live=all, /standings.
 */

const BASE = process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";
const KEY = process.env.API_FOOTBALL_KEY ?? "";

async function call<T>(path: string, params: Record<string, string | number>): Promise<T> {
  await apiFootballLimiter.take();
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    headers: { "x-apisports-key": KEY },
    // Provider responses are short-lived; revalidate via our own cache layer.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football ${path} → ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { errors?: unknown; response: T };
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football ${path} errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

// ── Mapping helpers ───────────────────────────────────────────────────────
function mapStatus(short: string): FixtureStatus {
  // API-Football fixture status short codes.
  switch (short) {
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "LIVE":
      return "live";
    case "HT":
      return "halftime";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
      return "cancelled";
    default:
      return "scheduled";
  }
}

/** Map a provider "round" string to our internal stage. */
function mapStage(round: string): Stage {
  const r = round.toLowerCase();
  if (r.includes("group")) return "group";
  if (r.includes("round of 32") || r.includes("1/16")) return "round_of_32";
  if (r.includes("round of 16") || r.includes("1/8")) return "round_of_16";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("final")) return "final";
  return "group";
}

function matchweekFromRound(round: string): number | null {
  const m = round.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}

export class ApiFootballProvider implements FootballProvider {
  readonly name = "api-football";

  async getTeams(ref: TournamentRef): Promise<ProviderTeam[]> {
    return cached(`af:teams:${ref.leagueId}:${ref.season}`, 60 * 60 * 12, async () => {
      const res = await call<any[]>("/teams", { league: ref.leagueId, season: ref.season });
      return res.map((r) => ({
        providerId: String(r.team.id),
        name: r.team.name,
        shortCode: r.team.code ?? null,
        flagUrl: r.team.logo ?? null,
        groupLabel: null, // group comes from /standings; merged at sync time
      }));
    });
  }

  async getFixtures(ref: TournamentRef): Promise<ProviderFixture[]> {
    return cached(`af:fixtures:${ref.leagueId}:${ref.season}`, 60, async () => {
      const res = await call<any[]>("/fixtures", { league: ref.leagueId, season: ref.season });
      return res.map(mapFixture);
    });
  }

  async getLiveFixtures(ref: TournamentRef): Promise<ProviderFixture[]> {
    // Live data must never be cached.
    const res = await call<any[]>("/fixtures", { league: ref.leagueId, season: ref.season, live: "all" });
    return res.map(mapFixture);
  }

  async getStandings(ref: TournamentRef): Promise<ProviderStanding[]> {
    return cached(`af:standings:${ref.leagueId}:${ref.season}`, 60 * 5, async () => {
      const res = await call<any[]>("/standings", { league: ref.leagueId, season: ref.season });
      const groups = res[0]?.league?.standings ?? [];
      const out: ProviderStanding[] = [];
      for (const group of groups as any[][]) {
        for (const row of group) {
          out.push({
            teamProviderId: String(row.team.id),
            groupLabel: (row.group ?? "").replace(/group\s*/i, "").trim(),
            rank: row.rank,
            played: row.all?.played ?? 0,
            points: row.points ?? 0,
          });
        }
      }
      return out;
    });
  }
}

function mapFixture(r: any): ProviderFixture {
  return {
    providerId: String(r.fixture.id),
    stage: mapStage(r.league?.round ?? ""),
    matchweek: matchweekFromRound(r.league?.round ?? ""),
    kickoffAt: r.fixture.date,
    status: mapStatus(r.fixture.status?.short ?? ""),
    homeProviderId: r.teams?.home?.id != null ? String(r.teams.home.id) : null,
    awayProviderId: r.teams?.away?.id != null ? String(r.teams.away.id) : null,
    homeScore: r.goals?.home ?? null,
    awayScore: r.goals?.away ?? null,
    minute: r.fixture.status?.elapsed ?? null,
  };
}

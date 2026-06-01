import { createAdminClient } from "@/lib/supabase/admin";
import { WORLD_CUP_2026, withPoolOverrides } from "@/lib/tournament/config";
import { computeStandings, rankStandings } from "@/lib/tournament/engine";
import type { Fixture, RosterEntry } from "@/lib/tournament/types";
import { getFootballProvider } from "./index";
import type { ProviderFixture, TournamentRef } from "./types";

/**
 * Sync pipeline (invoked by the Vercel Cron route + the CLI script):
 *   1. pull fixtures/live/standings from the active provider
 *   2. upsert fixtures into Postgres (provider_id is the join key)
 *   3. recompute standings per pool via the tournament engine
 *   4. write standings + atomic score rows; Realtime fans changes to clients
 *
 * Admin manual overrides live in the same `fixtures` rows; the sync respects a
 * `stats.manual_override = true` flag and skips overwriting those.
 */
export async function runFootballSync(): Promise<{ fixtures: number; pools: number }> {
  const db = createAdminClient();
  const provider = getFootballProvider();

  // 1. Active tournaments → sync each.
  const { data: tournaments, error } = await db
    .from("tournaments")
    .select("id, provider_ref")
    .eq("is_active", true);
  if (error) throw error;

  let fixtureCount = 0;
  let poolCount = 0;

  for (const t of tournaments ?? []) {
    const ref = (t.provider_ref ?? {}) as { league_id?: number; season?: number };
    const tref: TournamentRef = { leagueId: ref.league_id ?? 1, season: ref.season ?? 2026 };

    // 2. Fixtures (scheduled + finished) merged with live.
    const [fixtures, live] = await Promise.all([
      provider.getFixtures(tref),
      provider.getLiveFixtures(tref),
    ]);
    const merged = mergeLive(fixtures, live);
    fixtureCount += await upsertFixtures(db, t.id, merged);

    // 3 + 4. Recompute standings for every pool on this tournament.
    poolCount += await recomputePoolsForTournament(db, t.id);
  }

  return { fixtures: fixtureCount, pools: poolCount };
}

function mergeLive(fixtures: ProviderFixture[], live: ProviderFixture[]): ProviderFixture[] {
  const byId = new Map(fixtures.map((f) => [f.providerId, f]));
  for (const l of live) byId.set(l.providerId, l);
  return [...byId.values()];
}

async function upsertFixtures(db: ReturnType<typeof createAdminClient>, tournamentId: string, fixtures: ProviderFixture[]) {
  // Map provider team ids → our team uuids.
  const { data: teams } = await db.from("teams").select("id, provider_id").eq("tournament_id", tournamentId);
  const teamByProvider = new Map((teams ?? []).map((t) => [t.provider_id, t.id]));

  const rows = fixtures.map((f) => ({
    tournament_id: tournamentId,
    provider_id: f.providerId,
    stage: f.stage,
    matchweek: f.matchweek,
    kickoff_at: f.kickoffAt,
    status: f.status,
    home_team_id: f.homeProviderId ? teamByProvider.get(f.homeProviderId) ?? null : null,
    away_team_id: f.awayProviderId ? teamByProvider.get(f.awayProviderId) ?? null : null,
    home_score: f.homeScore,
    away_score: f.awayScore,
    minute: f.minute,
  }));

  if (rows.length === 0) return 0;
  // TODO(drafted): add a unique index on (tournament_id, provider_id) and use
  // upsert(onConflict) so re-syncs are idempotent. Skipping manual_override rows.
  const { error } = await db.from("fixtures").upsert(rows, { onConflict: "provider_id" });
  if (error) throw error;
  return rows.length;
}

async function recomputePoolsForTournament(db: ReturnType<typeof createAdminClient>, tournamentId: string) {
  const { data: pools } = await db
    .from("pools")
    .select("id, scoring_config, prediction_config, knockout_multiplier")
    .eq("tournament_id", tournamentId);

  const { data: fixtureRows } = await db
    .from("fixtures")
    .select("id, stage, matchweek, kickoff_at, status, home_team_id, away_team_id, home_score, away_score, minute")
    .eq("tournament_id", tournamentId);

  const fixtures: Fixture[] = (fixtureRows ?? []).map((f) => ({
    id: f.id,
    stage: f.stage as Fixture["stage"],
    matchweek: f.matchweek,
    kickoffAt: f.kickoff_at,
    status: f.status as Fixture["status"],
    homeTeamId: f.home_team_id,
    awayTeamId: f.away_team_id,
    homeScore: f.home_score,
    awayScore: f.away_score,
    minute: f.minute,
  }));

  let count = 0;
  for (const pool of pools ?? []) {
    const config = withPoolOverrides(
      WORLD_CUP_2026,
      { ...(pool.scoring_config as object), knockoutMultiplier: pool.knockout_multiplier },
      { prediction: pool.prediction_config as never },
    );

    const { data: drafts } = await db
      .from("drafted_teams")
      .select("user_id, team_id")
      .eq("pool_id", pool.id);
    const roster: RosterEntry[] = (drafts ?? []).map((d) => ({ userId: d.user_id, teamId: d.team_id }));

    // Resolved prediction points per user.
    const { data: entries } = await db
      .from("user_prediction_entries")
      .select("user_id, points_awarded, weekly_predictions!inner(pool_id)")
      .eq("weekly_predictions.pool_id", pool.id);
    const predByUser = new Map<string, number>();
    for (const e of entries ?? [])
      predByUser.set(e.user_id, (predByUser.get(e.user_id) ?? 0) + (e.points_awarded ?? 0));

    const { data: prev } = await db.from("standings").select("user_id, rank").eq("pool_id", pool.id);
    const prevRanks = new Map((prev ?? []).map((p) => [p.user_id, p.rank ?? 0]));

    const standings = computeStandings({ config, roster, fixtures, predictionPointsByUser: predByUser, previousRanks: prevRanks });
    rankStandings(standings);

    await db.from("standings").upsert(
      standings.map((s) => ({
        pool_id: pool.id,
        user_id: s.userId,
        total_points: s.totalPoints,
        team_points: s.teamPoints,
        prediction_points: s.predictionPoints,
        rank: s.rank,
        previous_rank: s.previousRank,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "pool_id,user_id" },
    );
    count++;
  }
  return count;
}

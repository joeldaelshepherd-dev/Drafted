import type {
  Fixture,
  RosterEntry,
  ScoreEvent,
  StandingRow,
  TournamentConfig,
} from "./types";
import { scoreFixture } from "./scoring";

/**
 * The tournament engine: turns rosters + fixtures into standings.
 * `computeStandings` is the authoritative leaderboard calc used by the sync
 * job; `projectLive` powers the matchday "if this score holds…" experience.
 */

function buildOwners(roster: RosterEntry[]): Map<string, string[]> {
  const owners = new Map<string, string[]>();
  for (const r of roster) {
    const list = owners.get(r.teamId) ?? [];
    list.push(r.userId);
    owners.set(r.teamId, list);
  }
  return owners;
}

export interface StandingsInput {
  config: TournamentConfig;
  roster: RosterEntry[];
  fixtures: Fixture[];
  /** Prediction points already resolved, keyed by userId. */
  predictionPointsByUser?: Map<string, number>;
  /** Prior ranks for movement indicators, keyed by userId. */
  previousRanks?: Map<string, number>;
}

/** Aggregate all finished-fixture + prediction points into ranked standings. */
export function computeStandings(input: StandingsInput): StandingRow[] {
  const owners = buildOwners(input.roster);
  const team = new Map<string, number>();
  const userIds = new Set(input.roster.map((r) => r.userId));

  for (const fixture of input.fixtures) {
    for (const ev of scoreFixture(input.config, fixture, owners)) {
      team.set(ev.userId, (team.get(ev.userId) ?? 0) + ev.points);
    }
  }

  const rows: StandingRow[] = [...userIds].map((userId) => {
    const teamPoints = team.get(userId) ?? 0;
    const predictionPoints = input.predictionPointsByUser?.get(userId) ?? 0;
    return {
      userId,
      teamPoints,
      predictionPoints,
      totalPoints: teamPoints + predictionPoints,
      rank: 0,
      previousRank: input.previousRanks?.get(userId) ?? null,
    };
  });

  return rankStandings(rows);
}

/** Stable ranking: total desc, then prediction points desc as tiebreak. */
export function rankStandings(rows: StandingRow[]): StandingRow[] {
  const sorted = [...rows].sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.predictionPoints - a.predictionPoints ||
      a.userId.localeCompare(b.userId),
  );
  sorted.forEach((row, i) => {
    row.rank = i + 1;
  });
  return sorted;
}

export interface LiveProjection {
  rows: StandingRow[];
  /** userId currently gaining the most from in-progress matches. */
  biggestRiserId: string | null;
  /** userId currently losing ground (was higher, now projected lower). */
  biggestFallerId: string | null;
  events: ScoreEvent[];
}

/**
 * Projected standings treating LIVE fixtures as if the current score were final.
 * Drives "currently benefiting most", "heartbreak watch", and animated movement.
 */
export function projectLive(
  config: TournamentConfig,
  roster: RosterEntry[],
  finishedFixtures: Fixture[],
  liveFixtures: Fixture[],
  predictionPointsByUser?: Map<string, number>,
): LiveProjection {
  const base = computeStandings({
    config,
    roster,
    fixtures: finishedFixtures,
    predictionPointsByUser,
  });
  const baseRankByUser = new Map(base.map((r) => [r.userId, r.rank]));

  // Treat live matches as finished at their current score.
  const asFinished = liveFixtures.map<Fixture>((f) => ({
    ...f,
    status: "finished",
  }));
  const owners = buildOwners(roster);
  const events: ScoreEvent[] = [];
  for (const f of asFinished) events.push(...scoreFixture(config, f, owners));

  const projected = computeStandings({
    config,
    roster,
    fixtures: [...finishedFixtures, ...asFinished],
    predictionPointsByUser,
    previousRanks: baseRankByUser,
  });

  // Biggest riser = most projected points gained from live matches.
  const liveGain = new Map<string, number>();
  for (const e of events)
    liveGain.set(e.userId, (liveGain.get(e.userId) ?? 0) + e.points);

  let biggestRiserId: string | null = null;
  let topGain = 0;
  for (const [userId, gain] of liveGain)
    if (gain > topGain) ((topGain = gain), (biggestRiserId = userId));

  // Biggest faller = dropped the most rank positions vs base.
  let biggestFallerId: string | null = null;
  let worstDrop = 0;
  for (const row of projected) {
    const was = baseRankByUser.get(row.userId);
    if (was != null) {
      const drop = row.rank - was;
      if (drop > worstDrop) ((worstDrop = drop), (biggestFallerId = row.userId));
    }
  }

  return { rows: projected, biggestRiserId, biggestFallerId, events };
}

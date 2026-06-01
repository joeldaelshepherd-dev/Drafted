import { getWorldCupTeam } from "@/lib/data/wc2026";
import { projectKnockout } from "./bracket";
import { generateGroupFixtures } from "./fixtures";
import { computeHubInsights, type HubInsights } from "./insights";
import { computeGroupTables } from "./standings";
import type { BracketRound, GroupTable, HubFixture } from "./types";

/**
 * Offline tournament-hub snapshot. Real WC2026 draw + schedule, zero fabricated
 * results: the tournament hasn't kicked off, so fixtures are all `upcoming`,
 * group tables sit at their seed-ordered baseline, and the bracket is a clearly
 * labelled FIFA-seeding projection.
 *
 * TODO(drafted): swap this for live data —
 *   1. fixtures + scores from the football provider (src/lib/football)
 *   2. group tables + knockout results recomputed from real results
 *   3. realtime refresh as matches go live.
 */
export interface TournamentHubData {
  fixtures: HubFixture[];
  tables: GroupTable[];
  bracket: BracketRound[];
  insights: HubInsights;
}

const seedOf = (teamId: string): number => getWorldCupTeam(teamId)?.fifaRanking ?? 999;

export function getDemoTournamentHub(): TournamentHubData {
  const fixtures = generateGroupFixtures();
  const tables = computeGroupTables(fixtures, seedOf);
  const bracket = projectKnockout(tables);
  const insights = computeHubInsights(fixtures);

  return { fixtures, tables, bracket, insights };
}

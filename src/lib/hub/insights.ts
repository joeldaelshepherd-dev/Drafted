import {
  WC2026_GROUPS,
  type WorldCupTeam,
  getWorldCupTeam,
  teamsInGroup,
} from "@/lib/data/wc2026";
import type { Confederation } from "@/lib/data/wc2026";
import type { HubFixture } from "./types";

/**
 * Tournament insights for the hub. Until matches are played there are no
 * results to mine, so every insight is grounded in the REAL group draw and FIFA
 * ranking — top seeds, the toughest group by average rank, a marquee opener,
 * and the confederation split. No fabricated scores or scorers.
 *
 * TODO(drafted): once live data exists, add leading scorers, biggest upsets
 * (low seed beats high seed), and live qualification scenarios.
 */

export interface GroupOfDeath {
  group: string;
  averageRank: number;
}

export interface MarqueeFixture {
  fixture: HubFixture;
  homeTeam: WorldCupTeam;
  awayTeam: WorldCupTeam;
  combinedRank: number;
}

export interface HubInsights {
  topSeeds: WorldCupTeam[];
  groupOfDeath: GroupOfDeath | null;
  marquee: MarqueeFixture | null;
  confederationCounts: { confederation: Confederation; count: number }[];
}

function averageRank(teams: WorldCupTeam[]): number {
  if (teams.length === 0) return 0;
  const sum = teams.reduce((acc, t) => acc + t.fifaRanking, 0);
  return Math.round((sum / teams.length) * 10) / 10;
}

export function computeHubInsights(fixtures: HubFixture[]): HubInsights {
  const allTeams = WC2026_GROUPS.flatMap((g) => teamsInGroup(g));

  const topSeeds = [...allTeams]
    .sort((a, b) => a.fifaRanking - b.fifaRanking)
    .slice(0, 5);

  let groupOfDeath: GroupOfDeath | null = null;
  for (const group of WC2026_GROUPS) {
    const avg = averageRank(teamsInGroup(group));
    if (groupOfDeath === null || avg < groupOfDeath.averageRank) {
      groupOfDeath = { group, averageRank: avg };
    }
  }

  // Marquee = the upcoming fixture with the strongest two teams (lowest combined rank).
  let marquee: MarqueeFixture | null = null;
  for (const f of fixtures) {
    if (f.homeTeamId == null || f.awayTeamId == null) continue;
    const homeTeam = getWorldCupTeam(f.homeTeamId);
    const awayTeam = getWorldCupTeam(f.awayTeamId);
    if (!homeTeam || !awayTeam) continue;
    const combinedRank = homeTeam.fifaRanking + awayTeam.fifaRanking;
    if (marquee === null || combinedRank < marquee.combinedRank) {
      marquee = { fixture: f, homeTeam, awayTeam, combinedRank };
    }
  }

  const counts = new Map<Confederation, number>();
  for (const t of allTeams) counts.set(t.confederation, (counts.get(t.confederation) ?? 0) + 1);
  const confederationCounts = [...counts.entries()]
    .map(([confederation, count]) => ({ confederation, count }))
    .sort((a, b) => b.count - a.count);

  return { topSeeds, groupOfDeath, marquee, confederationCounts };
}

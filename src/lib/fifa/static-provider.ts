/**
 * Static FIFA ranking provider — backed by the WC2026 dataset.
 * Pure and synchronous so the draft engine and view-models can call it freely.
 * A future live provider implements the same `RankingProvider` interface.
 */
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import type { RankingProvider, TeamRanking } from "./types";

/** Map a FIFA rank to a 0–100 rating (1 → 100, falling off gently). */
export function ratingFromRank(rank: number, fieldSize = WC2026_TEAMS.length): number {
  if (rank < 1) return 0;
  const clamped = Math.min(rank, fieldSize);
  return Math.round((1 - (clamped - 1) / fieldSize) * 100);
}

export function createStaticFifaProvider(): RankingProvider {
  const rankById = new Map<string, number>();
  const rankings: TeamRanking[] = WC2026_TEAMS.map((t) => {
    rankById.set(t.id, t.fifaRanking);
    return {
      teamId: t.id,
      rank: t.fifaRanking,
      rating: ratingFromRank(t.fifaRanking),
      confederation: t.confederation,
    };
  }).sort((a, b) => a.rank - b.rank);

  return {
    id: "fifa-static",
    label: "FIFA World Ranking",
    rankOf: (teamId) => rankById.get(teamId),
    ratingOf: (teamId) => {
      const r = rankById.get(teamId);
      return r == null ? 0 : ratingFromRank(r);
    },
    all: () => rankings.slice(),
  };
}

/** Default provider singleton for offline/demo rendering. */
export const fifaRanking: RankingProvider = createStaticFifaProvider();

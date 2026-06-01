/**
 * Ranking service abstraction.
 *
 * The draft (default sort, war room, auto-pick, projected strength) leans on a
 * single ranking signal. We hide the source behind `RankingProvider` so the
 * static FIFA dataset can later be swapped for a live FIFA feed, an Elo model,
 * or a pool-custom power ranking without touching any draft code.
 */
import type { Confederation } from "@/lib/data/wc2026";

export interface TeamRanking {
  teamId: string;
  /** 1 = strongest. Lower is better. */
  rank: number;
  /** Optional 0–100 strength score for grades/ratings; derived if absent. */
  rating?: number;
  confederation?: Confederation;
}

export type RankingSortKey = "ranking" | "alphabetical" | "confederation" | "popularity";

export interface RankingProvider {
  /** Stable id so the UI can label the active ranking system. */
  readonly id: string;
  readonly label: string;
  /** Rank for a single team (lower is stronger); undefined if unranked. */
  rankOf(teamId: string): number | undefined;
  /** 0–100 strength score (100 = #1). Derived from rank when not supplied. */
  ratingOf(teamId: string): number;
  /** All known rankings, ascending by rank. */
  all(): TeamRanking[];
}

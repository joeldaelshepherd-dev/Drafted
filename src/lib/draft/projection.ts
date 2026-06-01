/**
 * Projected strength + draft insights.
 *
 * Pure analysis layer over a completed/in-progress draft. Drives the
 * post-draft "strongest squad" leaderboard, squad grades, fun badges, and the
 * live commentary ticker. Explicitly NON-scoring — this never touches points.
 */
import type { Confederation, WorldCupTeam } from "@/lib/data/wc2026";
import type { RankingProvider } from "@/lib/fifa/types";
import type { DraftParticipant, DraftState } from "./types";
import { squadOf } from "./engine";

export interface SquadStrength {
  userId: string;
  name: string;
  teamIds: string[];
  /** Average FIFA rank of drafted teams (lower = stronger). */
  averageRank: number;
  /** 0–100 squad rating (higher = stronger). */
  rating: number;
  /** Letter grade derived from rating. */
  grade: string;
}

export interface SquadBadge {
  userId: string;
  label: string;
  detail: string;
}

const GRADE_BANDS: Array<{ min: number; grade: string }> = [
  { min: 90, grade: "A+" },
  { min: 83, grade: "A" },
  { min: 76, grade: "A-" },
  { min: 69, grade: "B+" },
  { min: 62, grade: "B" },
  { min: 55, grade: "B-" },
  { min: 48, grade: "C+" },
  { min: 40, grade: "C" },
  { min: 0, grade: "C-" },
];

export function gradeFromRating(rating: number): string {
  return GRADE_BANDS.find((b) => rating >= b.min)!.grade;
}

/** Average of each team's 0–100 rating; 0 for an empty squad. */
function squadRating(teamIds: string[], ranking: RankingProvider): number {
  if (teamIds.length === 0) return 0;
  const sum = teamIds.reduce((acc, id) => acc + ranking.ratingOf(id), 0);
  return Math.round(sum / teamIds.length);
}

function squadAverageRank(teamIds: string[], ranking: RankingProvider): number {
  if (teamIds.length === 0) return 0;
  const sum = teamIds.reduce((acc, id) => acc + (ranking.rankOf(id) ?? 0), 0);
  return Math.round((sum / teamIds.length) * 10) / 10;
}

/** Per-participant squad strength, ranked strongest first. */
export function projectedStrengths(
  state: DraftState,
  ranking: RankingProvider,
): SquadStrength[] {
  return state.participants
    .map((p): SquadStrength => {
      const teamIds = squadOf(state, p.userId);
      const rating = squadRating(teamIds, ranking);
      return {
        userId: p.userId,
        name: p.name,
        teamIds,
        averageRank: squadAverageRank(teamIds, ranking),
        rating,
        grade: gradeFromRating(rating),
      };
    })
    .sort((a, b) => b.rating - a.rating);
}

/** Fun, non-scoring awards. Computed from the strengths + raw squads. */
export function squadBadges(
  strengths: SquadStrength[],
  ranking: RankingProvider,
): SquadBadge[] {
  const badges: SquadBadge[] = [];
  if (strengths.length === 0) return badges;

  const byRating = [...strengths].sort((a, b) => b.rating - a.rating);
  badges.push({
    userId: byRating[0].userId,
    label: "Best Squad On Paper",
    detail: `Grade ${byRating[0].grade} · avg rank ${byRating[0].averageRank}`,
  });

  // Highest upside = best single team (lowest rank) on the roster.
  let upside = { userId: "", rank: Infinity };
  for (const s of strengths) {
    for (const id of s.teamIds) {
      const r = ranking.rankOf(id) ?? Infinity;
      if (r < upside.rank) upside = { userId: s.userId, rank: r };
    }
  }
  if (upside.userId) {
    const owner = strengths.find((s) => s.userId === upside.userId)!;
    badges.push({
      userId: owner.userId,
      label: "Highest Upside",
      detail: `Holds the #${upside.rank} team in the field`,
    });
  }

  // Most balanced = smallest spread between best and worst team rank.
  let balanced = { userId: "", spread: Infinity };
  for (const s of strengths) {
    if (s.teamIds.length < 2) continue;
    const ranks = s.teamIds.map((id) => ranking.rankOf(id) ?? 0);
    const spread = Math.max(...ranks) - Math.min(...ranks);
    if (spread < balanced.spread) balanced = { userId: s.userId, spread };
  }
  if (balanced.userId) {
    badges.push({
      userId: balanced.userId,
      label: "Most Balanced Squad",
      detail: "Tightest gap between best and worst pick",
    });
  }

  // Underdog specialist = weakest average squad (highest average rank).
  const underdog = [...strengths]
    .filter((s) => s.teamIds.length > 0)
    .sort((a, b) => b.averageRank - a.averageRank)[0];
  if (underdog) {
    badges.push({
      userId: underdog.userId,
      label: "Underdog Specialist",
      detail: `Leaning on long shots · avg rank ${underdog.averageRank}`,
    });
  }

  return badges;
}

export interface DraftInsights {
  /** Strongest team still on the board. */
  bestAvailable: WorldCupTeam | null;
  /** Pick made at the biggest gap below its rank ("steal of the draft"). */
  biggestSteal: { team: WorldCupTeam; overall: number; userId: string; gap: number } | null;
  /** Confederation drafted most often. */
  topConfederation: { confederation: Confederation; count: number } | null;
}

/**
 * Live commentary inputs. `teamsById` supplies metadata; `available` is the
 * remaining board (caller computes via availableTeams).
 */
export function draftInsights(
  state: DraftState,
  ranking: RankingProvider,
  teamsById: Map<string, WorldCupTeam>,
  available: string[],
): DraftInsights {
  // Best available by rank.
  let bestAvailable: WorldCupTeam | null = null;
  let bestRank = Infinity;
  for (const id of available) {
    const rank = ranking.rankOf(id) ?? Infinity;
    if (rank < bestRank) {
      bestRank = rank;
      bestAvailable = teamsById.get(id) ?? null;
    }
  }

  // Biggest steal: most picks where it went later than its rank suggests.
  let biggestSteal: DraftInsights["biggestSteal"] = null;
  for (const pick of state.picks) {
    const rank = ranking.rankOf(pick.teamId);
    const team = teamsById.get(pick.teamId);
    if (rank == null || !team) continue;
    // Pick "value" = how much later (overall, 1-based) it went than its rank.
    const gap = pick.overall + 1 - rank;
    if (!biggestSteal || gap > biggestSteal.gap) {
      biggestSteal = { team, overall: pick.overall, userId: pick.userId, gap };
    }
  }

  // Most-drafted confederation.
  const counts = new Map<Confederation, number>();
  for (const pick of state.picks) {
    const team = teamsById.get(pick.teamId);
    if (!team) continue;
    counts.set(team.confederation, (counts.get(team.confederation) ?? 0) + 1);
  }
  let topConfederation: DraftInsights["topConfederation"] = null;
  for (const [confederation, count] of counts) {
    if (!topConfederation || count > topConfederation.count) {
      topConfederation = { confederation, count };
    }
  }

  return { bestAvailable, biggestSteal, topConfederation };
}

/** Short, ready-to-render commentary lines for the live insights panel. */
export function insightLines(insights: DraftInsights): string[] {
  const lines: string[] = [];
  if (insights.bestAvailable) {
    lines.push(
      `Highest-ranked team remaining: ${insights.bestAvailable.name} (#${insights.bestAvailable.fifaRanking})`,
    );
  }
  if (insights.biggestSteal && insights.biggestSteal.gap > 0) {
    lines.push(
      `Biggest steal so far: ${insights.biggestSteal.team.name} (#${insights.biggestSteal.team.fifaRanking})`,
    );
  }
  if (insights.topConfederation) {
    lines.push(
      `Most drafted confederation: ${insights.topConfederation.confederation} (${insights.topConfederation.count})`,
    );
  }
  return lines;
}

/** Resolve a userId → display name from participants. */
export function nameOfParticipant(participants: DraftParticipant[], userId: string): string {
  return participants.find((p) => p.userId === userId)?.name ?? "Unknown";
}

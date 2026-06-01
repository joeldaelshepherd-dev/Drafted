/**
 * Draft engine — pure transitions over DraftState.
 *
 * Every function is side-effect free and returns a new state (or a derived
 * value), so the same code powers the offline reducer hook, unit tests, and a
 * future server authority that validates Supabase Realtime events.
 */
import type { RankingProvider } from "@/lib/fifa/types";
import type { DraftLogEntry, DraftPick, DraftState } from "./types";
import { locatePick } from "./order";

/** Total number of picks in the draft. */
export function totalPicks(state: DraftState): number {
  return state.order.length;
}

/** userId on the clock right now, or null if the draft is over/out of range. */
export function currentDrafter(state: DraftState): string | null {
  return state.order[state.currentPickIndex] ?? null;
}

/** Set of teamIds already drafted. */
export function draftedTeamIds(state: DraftState): Set<string> {
  return new Set(state.picks.map((p) => p.teamId));
}

/** Teams still on the board, preserving the caller's input ordering. */
export function availableTeams(state: DraftState, allTeamIds: string[]): string[] {
  const taken = draftedTeamIds(state);
  return allTeamIds.filter((id) => !taken.has(id));
}

/** Squad (teamIds) a participant has drafted so far, in pick order. */
export function squadOf(state: DraftState, userId: string): string[] {
  return state.picks.filter((p) => p.userId === userId).map((p) => p.teamId);
}

export interface PickValidation {
  ok: boolean;
  reason?: "not_live" | "not_your_turn" | "already_drafted" | "unknown_team" | "draft_over";
}

export function validatePick(
  state: DraftState,
  userId: string,
  teamId: string,
  allTeamIds: string[],
): PickValidation {
  if (state.status !== "live") return { ok: false, reason: "not_live" };
  if (state.currentPickIndex >= state.order.length) return { ok: false, reason: "draft_over" };
  if (currentDrafter(state) !== userId) return { ok: false, reason: "not_your_turn" };
  if (!allTeamIds.includes(teamId)) return { ok: false, reason: "unknown_team" };
  if (draftedTeamIds(state).has(teamId)) return { ok: false, reason: "already_drafted" };
  return { ok: true };
}

function pruneQueues(queues: Record<string, string[]>, teamId: string): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const [userId, q] of Object.entries(queues)) {
    next[userId] = q.filter((id) => id !== teamId);
  }
  return next;
}

/**
 * Apply a pick. Returns the original state unchanged when invalid (callers can
 * check via validatePick first for messaging). `now` and the name/teamList are
 * injected to keep the engine pure and tournament-agnostic.
 */
export function applyPick(
  state: DraftState,
  userId: string,
  teamId: string,
  opts: { allTeamIds: string[]; nameOf: (id: string) => string; auto?: boolean; now?: number },
): DraftState {
  const v = validatePick(state, userId, teamId, opts.allTeamIds);
  if (!v.ok) return state;

  const now = opts.now ?? Date.now();
  const { round, slot } = locatePick(state.currentPickIndex, state.participants.length);
  const pick: DraftPick = {
    overall: state.currentPickIndex,
    round,
    slot,
    userId,
    teamId,
    auto: opts.auto ?? false,
    at: new Date(now).toISOString(),
  };

  const nextIndex = state.currentPickIndex + 1;
  const isOver = nextIndex >= state.order.length;
  const drafterName = state.participants.find((p) => p.userId === userId)?.name ?? "Someone";
  const tName = opts.nameOf(teamId);

  const log: DraftLogEntry[] = [
    ...state.log,
    {
      kind: opts.auto ? "auto_pick" : "pick",
      at: pick.at,
      userId,
      teamId,
      message: opts.auto
        ? `Auto Pick: ${drafterName} selected ${tName}`
        : `${drafterName} selected ${tName}`,
    },
  ];

  if (isOver) {
    log.push({ kind: "complete", at: new Date(now).toISOString(), message: "Draft complete" });
  }

  return {
    ...state,
    picks: [...state.picks, pick],
    currentPickIndex: nextIndex,
    queues: pruneQueues(state.queues, teamId),
    status: isOver ? "complete" : state.status,
    deadlineAt: isOver ? null : state.deadlineAt,
    log,
  };
}

/**
 * Decide the team the auto-pick should take for the drafter on the clock:
 * highest-ranked available team from their queue, else best available overall.
 */
export function autoPickTeam(
  state: DraftState,
  ranking: RankingProvider,
  allTeamIds: string[],
): string | null {
  const userId = currentDrafter(state);
  if (!userId) return null;
  const available = new Set(availableTeams(state, allTeamIds));

  const queue = state.queues[userId] ?? [];
  for (const teamId of queue) {
    if (available.has(teamId)) return teamId;
  }

  let best: string | null = null;
  let bestRank = Infinity;
  for (const teamId of available) {
    const rank = ranking.rankOf(teamId) ?? Infinity;
    if (rank < bestRank) {
      bestRank = rank;
      best = teamId;
    }
  }
  return best;
}

/** Run the auto-pick: choose + apply in one step. No-op if nothing available. */
export function runAutoPick(
  state: DraftState,
  ranking: RankingProvider,
  opts: { allTeamIds: string[]; nameOf: (id: string) => string; now?: number },
): DraftState {
  const userId = currentDrafter(state);
  const teamId = autoPickTeam(state, ranking, opts.allTeamIds);
  if (!userId || !teamId) return state;
  return applyPick(state, userId, teamId, { ...opts, auto: true });
}

export interface UpcomingPick {
  overall: number;
  round: number;
  slot: number;
  userId: string;
  onDeck: boolean;
}

/** The next `count` picks (including the one on the clock). */
export function upcomingPicks(state: DraftState, count = 5): UpcomingPick[] {
  const out: UpcomingPick[] = [];
  for (let i = state.currentPickIndex; i < state.order.length && out.length < count; i++) {
    const { round, slot } = locatePick(i, state.participants.length);
    out.push({
      overall: i,
      round,
      slot,
      userId: state.order[i],
      onDeck: i === state.currentPickIndex + 1,
    });
  }
  return out;
}

/**
 * How many picks until `userId` is next on the clock (0 = on the clock now).
 * Returns null if the user has no remaining picks.
 */
export function picksUntil(state: DraftState, userId: string): number | null {
  for (let i = state.currentPickIndex; i < state.order.length; i++) {
    if (state.order[i] === userId) return i - state.currentPickIndex;
  }
  return null;
}

/** Order-tracker slots: previous / current / next / on-deck userIds. */
export function orderTracker(state: DraftState) {
  const i = state.currentPickIndex;
  return {
    previous: i - 1 >= 0 ? state.order[i - 1] ?? null : null,
    current: state.order[i] ?? null,
    next: state.order[i + 1] ?? null,
    onDeck: state.order[i + 2] ?? null,
  };
}

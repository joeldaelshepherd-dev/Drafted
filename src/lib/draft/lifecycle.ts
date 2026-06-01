/**
 * Draft lifecycle transitions: build → start → pause → resume → cancel.
 * Pure functions returning new DraftState. Timer math lives in the client hook;
 * here we only set/clear `deadlineAt`.
 */
import type {
  AllocationMode,
  DraftParticipant,
  DraftSettings,
  DraftState,
} from "./types";
import { generateOrder, shuffleOrder } from "./order";

/** Rounds (teams per participant) for an allocation strategy. */
export function roundsFor(
  settings: DraftSettings,
  participantCount: number,
  poolTeamCount: number,
): number {
  if (settings.allocationMode === "fixed") return Math.max(1, settings.teamsPerUser);
  // "all" → distribute every team as evenly as possible.
  return Math.max(1, Math.floor(poolTeamCount / Math.max(1, participantCount)));
}

export interface CreateDraftArgs {
  settings: DraftSettings;
  participants: DraftParticipant[];
  poolTeamCount: number;
  /** Pre-randomised order ids when orderMode === "random"; defaults to participant order. */
  orderSeed?: string[];
  rng?: () => number;
}

/** Build a fresh draft in the "lobby" state, order resolved. */
export function createDraft(args: CreateDraftArgs): DraftState {
  const { settings, participants, poolTeamCount } = args;
  const baseIds = participants.map((p) => p.userId);
  const firstRound =
    settings.orderMode === "random"
      ? args.orderSeed ?? shuffleOrder(baseIds, args.rng)
      : baseIds;
  const rounds = roundsFor(settings, participants.length, poolTeamCount);

  return {
    settings,
    participants,
    rounds,
    order: generateOrder(firstRound, rounds, settings.format),
    picks: [],
    currentPickIndex: 0,
    status: "lobby",
    queues: Object.fromEntries(participants.map((p) => [p.userId, []])),
    deadlineAt: null,
    log: [],
  };
}

/** Begin the draft: lobby → live, arm the first clock. */
export function startDraft(state: DraftState, now = Date.now()): DraftState {
  if (state.status !== "lobby") return state;
  return {
    ...state,
    status: "live",
    deadlineAt: now + state.settings.pickSeconds * 1000,
    log: [
      ...state.log,
      { kind: "draft_started", at: new Date(now).toISOString(), message: "The Draft Has Begun" },
    ],
  };
}

/** Pause the clock; remaining seconds are recomputed on resume. */
export function pauseDraft(state: DraftState, now = Date.now()): DraftState {
  if (state.status !== "live") return state;
  const remainingMs = Math.max(0, (state.deadlineAt ?? now) - now);
  return {
    ...state,
    status: "paused",
    // Stash remaining time in deadlineAt as a duration sentinel (negative-safe).
    deadlineAt: remainingMs,
    log: [...state.log, { kind: "paused", at: new Date(now).toISOString(), message: "Draft paused" }],
  };
}

/** Resume from pause, restoring the remaining clock. */
export function resumeDraft(state: DraftState, now = Date.now()): DraftState {
  if (state.status !== "paused") return state;
  const remainingMs = state.deadlineAt ?? state.settings.pickSeconds * 1000;
  return {
    ...state,
    status: "live",
    deadlineAt: now + remainingMs,
    log: [...state.log, { kind: "resumed", at: new Date(now).toISOString(), message: "Draft resumed" }],
  };
}

/** Cancel: wipe picks/history, return to a clean lobby-less terminal state. */
export function cancelDraft(state: DraftState, now = Date.now()): DraftState {
  return {
    ...state,
    status: "cancelled",
    picks: [],
    currentPickIndex: 0,
    queues: Object.fromEntries(state.participants.map((p) => [p.userId, []])),
    deadlineAt: null,
    log: [
      ...state.log,
      { kind: "cancelled", at: new Date(now).toISOString(), message: "Draft cancelled" },
    ],
  };
}

/** Re-arm the clock for the pick now on the clock (call after each pick). */
export function armClock(state: DraftState, now = Date.now()): DraftState {
  if (state.status !== "live") return state;
  return { ...state, deadlineAt: now + state.settings.pickSeconds * 1000 };
}

// ---- Queue management -------------------------------------------------------

export function enqueueTeam(state: DraftState, userId: string, teamId: string): DraftState {
  const q = state.queues[userId] ?? [];
  if (q.includes(teamId)) return state;
  return { ...state, queues: { ...state.queues, [userId]: [...q, teamId] } };
}

export function dequeueTeam(state: DraftState, userId: string, teamId: string): DraftState {
  const q = state.queues[userId] ?? [];
  return { ...state, queues: { ...state.queues, [userId]: q.filter((id) => id !== teamId) } };
}

/** Move a queued team to a new index (drag-and-drop reorder). */
export function reorderQueue(
  state: DraftState,
  userId: string,
  fromIndex: number,
  toIndex: number,
): DraftState {
  const q = (state.queues[userId] ?? []).slice();
  if (fromIndex < 0 || fromIndex >= q.length) return state;
  const [moved] = q.splice(fromIndex, 1);
  const clampedTo = Math.max(0, Math.min(toIndex, q.length));
  q.splice(clampedTo, 0, moved);
  return { ...state, queues: { ...state.queues, [userId]: q } };
}

/** The team this user's auto-pick would currently take from their queue. */
export function likelyAutoPick(
  state: DraftState,
  userId: string,
  available: Set<string>,
): string | null {
  for (const teamId of state.queues[userId] ?? []) {
    if (available.has(teamId)) return teamId;
  }
  return null;
}

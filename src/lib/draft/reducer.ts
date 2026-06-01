/**
 * Draft reducer — the single mutation surface for the client.
 *
 * Wraps the pure engine/lifecycle transitions in a flat action union so the
 * `useDraft` hook (and, later, a Supabase Realtime sync) can dispatch the same
 * events. Picks auto-arm the next clock; the hook only fires TICK / EXPIRE.
 */
import type { RankingProvider } from "@/lib/fifa/types";
import type { DraftState } from "./types";
import { applyPick, runAutoPick } from "./engine";
import {
  armClock,
  cancelDraft,
  dequeueTeam,
  enqueueTeam,
  pauseDraft,
  reorderQueue,
  resumeDraft,
  startDraft,
} from "./lifecycle";

export interface DraftDeps {
  ranking: RankingProvider;
  allTeamIds: string[];
  nameOf: (id: string) => string;
}

export type DraftAction =
  | { type: "START"; now?: number }
  | { type: "PICK"; userId: string; teamId: string; now?: number }
  | { type: "EXPIRE"; now?: number }
  | { type: "PAUSE"; now?: number }
  | { type: "RESUME"; now?: number }
  | { type: "CANCEL"; now?: number }
  | { type: "ENQUEUE"; userId: string; teamId: string }
  | { type: "DEQUEUE"; userId: string; teamId: string }
  | { type: "REORDER_QUEUE"; userId: string; from: number; to: number };

/** Build a reducer bound to the (stable) tournament deps. */
export function makeDraftReducer(deps: DraftDeps) {
  const pickOpts = (now?: number) => ({
    allTeamIds: deps.allTeamIds,
    nameOf: deps.nameOf,
    now,
  });

  return function draftReducer(state: DraftState, action: DraftAction): DraftState {
    switch (action.type) {
      case "START":
        return startDraft(state, action.now);

      case "PICK": {
        const after = applyPick(state, action.userId, action.teamId, pickOpts(action.now));
        if (after === state) return state; // invalid pick, no change
        return after.status === "live" ? armClock(after, action.now) : after;
      }

      case "EXPIRE": {
        if (state.status !== "live") return state;
        const after = runAutoPick(state, deps.ranking, pickOpts(action.now));
        if (after === state) return state;
        return after.status === "live" ? armClock(after, action.now) : after;
      }

      case "PAUSE":
        return pauseDraft(state, action.now);

      case "RESUME":
        return resumeDraft(state, action.now);

      case "CANCEL":
        return cancelDraft(state, action.now);

      case "ENQUEUE":
        return enqueueTeam(state, action.userId, action.teamId);

      case "DEQUEUE":
        return dequeueTeam(state, action.userId, action.teamId);

      case "REORDER_QUEUE":
        return reorderQueue(state, action.userId, action.from, action.to);

      default:
        return state;
    }
  };
}

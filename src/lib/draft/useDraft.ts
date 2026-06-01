"use client";

/**
 * useDraft — drives an offline, fully interactive mock draft.
 *
 * Owns a reducer over DraftState plus a 250ms ticker that (a) exposes the live
 * clock for the circular timer and (b) auto-fires EXPIRE when the deadline
 * passes, so the auto-pick fallback runs exactly like a server-authoritative
 * draft would. Swap the reducer dispatch for Supabase Realtime in production.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { RankingProvider } from "@/lib/fifa/types";
import type { DraftState } from "./types";
import { availableTeams, currentDrafter, picksUntil } from "./engine";
import { likelyAutoPick } from "./lifecycle";
import { type DraftDeps, makeDraftReducer } from "./reducer";

export interface UseDraftOptions {
  initial: DraftState;
  ranking: RankingProvider;
  allTeamIds: string[];
  nameOf: (id: string) => string;
  /** The viewer — powers "your pick in N" + queue ownership. */
  currentUserId: string;
}

export interface DraftClock {
  /** Whole seconds left on the clock. */
  secondsLeft: number;
  /** 0–1 fraction of the pick window remaining (for the ring). */
  fraction: number;
  /** Urgency band drives the colour/pulse. */
  tone: "normal" | "warning" | "critical";
}

export function useDraft(opts: UseDraftOptions) {
  const deps: DraftDeps = useMemo(
    () => ({ ranking: opts.ranking, allTeamIds: opts.allTeamIds, nameOf: opts.nameOf }),
    [opts.ranking, opts.allTeamIds, opts.nameOf],
  );
  const reducer = useMemo(() => makeDraftReducer(deps), [deps]);
  const [state, dispatch] = useReducer(reducer, opts.initial);
  const [now, setNow] = useState(() => Date.now());

  // Single ticker: refresh `now` 4×/sec while the clock is running.
  useEffect(() => {
    if (state.status !== "live" || state.deadlineAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status, state.deadlineAt]);

  // Fire EXPIRE once when the deadline passes. A ref guards against double-fire
  // across renders before the reducer re-arms the clock.
  const firedFor = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== "live" || state.deadlineAt == null) return;
    if (now >= state.deadlineAt && firedFor.current !== state.currentPickIndex) {
      firedFor.current = state.currentPickIndex;
      dispatch({ type: "EXPIRE", now });
    }
  }, [now, state.status, state.deadlineAt, state.currentPickIndex]);

  const clock: DraftClock = useMemo(() => {
    const windowMs = state.settings.pickSeconds * 1000;
    const leftMs =
      state.status === "live" && state.deadlineAt != null
        ? Math.max(0, state.deadlineAt - now)
        : state.status === "paused" && state.deadlineAt != null
          ? state.deadlineAt // paused: deadlineAt holds remaining ms
          : windowMs;
    const secondsLeft = Math.ceil(leftMs / 1000);
    const fraction = windowMs > 0 ? Math.max(0, Math.min(1, leftMs / windowMs)) : 0;
    const tone: DraftClock["tone"] =
      secondsLeft <= 10 ? "critical" : secondsLeft <= 20 ? "warning" : "normal";
    return { secondsLeft, fraction, tone };
  }, [now, state.status, state.deadlineAt, state.settings.pickSeconds]);

  const available = useMemo(
    () => availableTeams(state, opts.allTeamIds),
    [state, opts.allTeamIds],
  );
  const onTheClock = currentDrafter(state);
  const isMyTurn = onTheClock === opts.currentUserId;
  const myPicksAway = picksUntil(state, opts.currentUserId);
  const myQueue = state.queues[opts.currentUserId] ?? [];
  const myLikelyAutoPick = useMemo(
    () => likelyAutoPick(state, opts.currentUserId, new Set(available)),
    [state, opts.currentUserId, available],
  );

  // Stable action creators.
  const start = useCallback(() => dispatch({ type: "START" }), []);
  const pick = useCallback(
    (teamId: string, userId = opts.currentUserId) =>
      dispatch({ type: "PICK", userId, teamId }),
    [opts.currentUserId],
  );
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const cancel = useCallback(() => dispatch({ type: "CANCEL" }), []);
  const enqueue = useCallback(
    (teamId: string, userId = opts.currentUserId) =>
      dispatch({ type: "ENQUEUE", userId, teamId }),
    [opts.currentUserId],
  );
  const dequeue = useCallback(
    (teamId: string, userId = opts.currentUserId) =>
      dispatch({ type: "DEQUEUE", userId, teamId }),
    [opts.currentUserId],
  );
  const reorderQueue = useCallback(
    (from: number, to: number, userId = opts.currentUserId) =>
      dispatch({ type: "REORDER_QUEUE", userId, from, to }),
    [opts.currentUserId],
  );

  return {
    state,
    clock,
    available,
    onTheClock,
    isMyTurn,
    myPicksAway,
    myQueue,
    myLikelyAutoPick,
    actions: { start, pick, pause, resume, cancel, enqueue, dequeue, reorderQueue },
  };
}

export type UseDraftReturn = ReturnType<typeof useDraft>;

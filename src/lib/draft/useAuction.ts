"use client";

/**
 * useAuction — drives an offline, fully interactive mock auction / hybrid draft.
 *
 * Mirrors useDraft: a reducer over AuctionState plus a 250ms ticker that exposes
 * the live clock and fires EXPIRE when a deadline passes. Unlike the pick draft,
 * each auction transition arms its own clock (a nomination clock between lots, a
 * bid clock once a nation is on the block), so the reducer stays thin. A second
 * effect lets the bot managers nominate and bid on a human-feeling cadence.
 * Swap the reducer dispatch for Supabase Realtime in production.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { RankingProvider } from "@/lib/fifa/types";
import {
  type AuctionOpts,
  type AuctionState,
  bidSeconds,
  botCeilingFor,
  cancelAuction,
  expireAuction,
  maxBidFor,
  minNextBid,
  nextBotBid,
  nextBotNomination,
  nominate,
  nominateSeconds,
  nominator,
  pauseAuction,
  placeBid,
  raiseStep,
  resumeAuction,
  slotsRemaining,
  squadFull,
  startAuction,
} from "./auction";

export interface UseAuctionOptions {
  initial: AuctionState;
  ranking: RankingProvider;
  nameOf: (id: string) => string;
  /** The viewer — the one human manager; everyone else is a bot. */
  currentUserId: string;
}

export interface AuctionClock {
  secondsLeft: number;
  fraction: number;
  tone: "normal" | "warning" | "critical";
}

type AuctionAction =
  | { type: "START"; now?: number }
  | { type: "NOMINATE"; userId: string; teamId: string; now?: number }
  | { type: "BID"; userId: string; amount: number; now?: number }
  | { type: "EXPIRE"; now?: number }
  | { type: "PAUSE"; now?: number }
  | { type: "RESUME"; now?: number }
  | { type: "CANCEL"; now?: number };

function makeAuctionReducer(opts: AuctionOpts) {
  return function auctionReducer(state: AuctionState, action: AuctionAction): AuctionState {
    switch (action.type) {
      case "START":
        return startAuction(state, opts, action.now);
      case "NOMINATE":
        return nominate(state, action.userId, action.teamId, opts, action.now);
      case "BID":
        return placeBid(state, action.userId, action.amount, opts, action.now);
      case "EXPIRE":
        return expireAuction(state, opts, action.now);
      case "PAUSE":
        return pauseAuction(state, action.now);
      case "RESUME":
        return resumeAuction(state, action.now);
      case "CANCEL":
        return cancelAuction(state, action.now);
      default:
        return state;
    }
  };
}

export function useAuction(opts: UseAuctionOptions) {
  const { ranking, currentUserId } = opts;
  const auctionOpts: AuctionOpts = useMemo(() => ({ nameOf: opts.nameOf }), [opts.nameOf]);
  const reducer = useMemo(() => makeAuctionReducer(auctionOpts), [auctionOpts]);
  const [state, dispatch] = useReducer(reducer, opts.initial);
  const [now, setNow] = useState(() => Date.now());

  // Single ticker: refresh `now` 4×/sec while the clock is running.
  useEffect(() => {
    if (state.status !== "live" || state.deadlineAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.status, state.deadlineAt]);

  // Fire EXPIRE once per armed deadline. The ref guards against a double-fire
  // before the next transition re-arms the clock with a fresh deadline.
  const firedFor = useRef<number | null>(null);
  useEffect(() => {
    if (state.status !== "live" || state.deadlineAt == null) return;
    if (now >= state.deadlineAt && firedFor.current !== state.deadlineAt) {
      firedFor.current = state.deadlineAt;
      dispatch({ type: "EXPIRE", now });
    }
  }, [now, state.status, state.deadlineAt]);

  // Bot managers act on a cadence so the room feels alive: nominate when it's
  // their turn, raise the leader when a lot is open and within their ceiling.
  const botActedRef = useRef<string>("");
  useEffect(() => {
    if (state.status !== "live" || state.deadlineAt == null) return;
    const elapsed = now - state.lastActionAt;

    if (state.current) {
      // Bidding: give the human a beat, then let one keen bot raise by 1.
      if (elapsed < 650) return;
      const lot = state.current;
      const sig = `bid:${lot.teamId}:${lot.highBid}`;
      if (botActedRef.current === sig) return;
      const contenders = state.participants
        .filter((p) => p.userId !== currentUserId && p.userId !== lot.highBidder)
        .map((p) => ({
          userId: p.userId,
          bid: nextBotBid(state, p.userId, ranking),
          ceiling: botCeilingFor(state, p.userId, lot.teamId, ranking),
        }))
        .filter((c): c is { userId: string; bid: number; ceiling: number } => c.bid != null);
      if (contenders.length === 0) return;
      contenders.sort((a, b) => b.ceiling - a.ceiling);
      botActedRef.current = sig;
      dispatch({ type: "BID", userId: contenders[0].userId, amount: contenders[0].bid });
      return;
    }

    // Nominating: bots nominate promptly; the human nominates via the UI (or the
    // clock auto-nominates for them on expiry).
    if (elapsed < 450) return;
    const who = nominator(state);
    if (!who || who === currentUserId) return;
    const teamId = nextBotNomination(state, who);
    if (!teamId) return;
    const sig = `nom:${who}:${state.wins.length}`;
    if (botActedRef.current === sig) return;
    botActedRef.current = sig;
    dispatch({ type: "NOMINATE", userId: who, teamId });
  }, [now, state, currentUserId, ranking]);

  const clock: AuctionClock = useMemo(() => {
    const windowMs =
      (state.current ? bidSeconds(state.settings) : nominateSeconds(state.settings)) * 1000;
    const leftMs =
      state.status === "live" && state.deadlineAt != null
        ? Math.max(0, state.deadlineAt - now)
        : state.status === "paused" && state.deadlineAt != null
          ? state.deadlineAt // paused: deadlineAt holds remaining ms
          : windowMs;
    const secondsLeft = Math.ceil(leftMs / 1000);
    const fraction = windowMs > 0 ? Math.max(0, Math.min(1, leftMs / windowMs)) : 0;
    const tone: AuctionClock["tone"] =
      secondsLeft <= 5 ? "critical" : secondsLeft <= 10 ? "warning" : "normal";
    return { secondsLeft, fraction, tone };
  }, [now, state.status, state.deadlineAt, state.current, state.settings]);

  // Viewer-centric derived state for the UI.
  const onNomination = nominator(state);
  const isMyNomination = !state.current && onNomination === currentUserId;
  const myBudget = state.budgets[currentUserId] ?? 0;
  const myMaxBid = maxBidFor(state, currentUserId);
  const mySlotsLeft = slotsRemaining(state, currentUserId);
  const nextBid = minNextBid(state);
  const bidStep = raiseStep(state.settings);
  // Lot leader: highBid is 0 / winningUserId "" until the first bid lands.
  const currentHigh = state.current?.highBid ?? 0;
  const winningUserId = state.current?.highBidder || null;
  const iAmWinning = winningUserId === currentUserId && winningUserId != null;
  const canIBid =
    state.current != null &&
    state.current.highBidder !== currentUserId &&
    !squadFull(state, currentUserId) &&
    nextBid <= myMaxBid;

  // Stable action creators.
  const start = useCallback(() => dispatch({ type: "START" }), []);
  const nominateTeam = useCallback(
    (teamId: string, userId = currentUserId) => dispatch({ type: "NOMINATE", userId, teamId }),
    [currentUserId],
  );
  const bid = useCallback(
    (amount: number, userId = currentUserId) => dispatch({ type: "BID", userId, amount }),
    [currentUserId],
  );
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const cancel = useCallback(() => dispatch({ type: "CANCEL" }), []);

  return {
    state,
    clock,
    onNomination,
    isMyNomination,
    myBudget,
    myMaxBid,
    mySlotsLeft,
    nextBid,
    bidStep,
    currentHigh,
    winningUserId,
    iAmWinning,
    canIBid,
    actions: { start, nominateTeam, bid, pause, resume, cancel },
  };
}

export type UseAuctionReturn = ReturnType<typeof useAuction>;

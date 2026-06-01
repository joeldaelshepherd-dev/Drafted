/**
 * Auction & hybrid draft engine — pure transitions over AuctionState.
 *
 * Like the pick engine (engine.ts) this is side-effect free and React-free, so
 * the same code powers the offline reducer hook (useAuction), unit tests, and a
 * future Supabase-authoritative auction. The clock's `deadlineAt` does double
 * duty: it's the nomination clock when no lot is open, and the bid clock once a
 * nation is on the block.
 *
 *  - "auction" → every nation is nominate-able; managers bid credits until each
 *    squad is full (a free "fill" tops up if the room ever stalls).
 *  - "hybrid"  → only the top `marqueeCount` nations go to auction; the rest of
 *    each squad is filled by a needs-based serpentine draft.
 */
import type { RankingProvider } from "@/lib/fifa/types";
import { roundsFor } from "./lifecycle";
import { shuffleOrder } from "./order";
import {
  MIN_BID_PCT,
  RAISE_STEP_PCT,
  type DraftParticipant,
  type DraftPick,
  type DraftSettings,
  type DraftState,
  type DraftStyle,
} from "./types";

export type AuctionStatus =
  | "lobby"
  | "live"
  | "paused"
  | "filling"
  | "complete"
  | "cancelled";

/** The nation currently on the block. */
export interface AuctionLot {
  teamId: string;
  /** Who put it up for auction. */
  nominatedBy: string;
  /** Current leading bid (credits); 0 until the first bid lands. */
  highBid: number;
  /** userId of the current leader, or "" while the lot has no bids yet. */
  highBidder: string;
}

/** A settled lot — a nation a manager now owns. */
export interface AuctionWin {
  teamId: string;
  userId: string;
  /** Credits paid (0 when topped up by the fill draft). */
  price: number;
  nominatedBy: string;
  /** True when assigned by the fill draft rather than a live bid. */
  auto: boolean;
  at: string;
}

export type AuctionLogKind =
  | "auction_started"
  | "nominate"
  | "bid"
  | "sold"
  | "recycle"
  | "fill"
  | "paused"
  | "resumed"
  | "cancelled"
  | "complete";

export interface AuctionLogEntry {
  kind: AuctionLogKind;
  at: string;
  userId?: string;
  teamId?: string;
  amount?: number;
  message: string;
}

export interface AuctionState {
  settings: DraftSettings;
  participants: DraftParticipant[];
  /** "auction" or "hybrid" (never "draft"). */
  style: Exclude<DraftStyle, "draft">;
  /** Nations each manager ends up with. */
  squadSize: number;
  /** Every nation in the pool — used by the fill draft. */
  boardTeamIds: string[];
  /** Nations still up for auction (hybrid = remaining marquee nations). */
  lotPool: string[];
  /** Teams already re-offered once after drawing no bids — won't recycle twice. */
  recycled: string[];
  /** Rotating nomination order (userIds). */
  nominationOrder: string[];
  /** Index into nominationOrder of the next/current nominator. */
  nominationIndex: number;
  /** Nation on the block, or null between lots. */
  current: AuctionLot | null;
  wins: AuctionWin[];
  /** Remaining credits per manager. */
  budgets: Record<string, number>;
  status: AuctionStatus;
  /** Epoch ms the active clock expires; null when not running. */
  deadlineAt: number | null;
  /** Epoch ms of the last nominate/bid/sell — throttles bot cadence. */
  lastActionAt: number;
  log: AuctionLogEntry[];
}

/** Side-channel deps for human-readable log messages (team display names). */
export interface AuctionOpts {
  nameOf: (teamId: string) => string;
}

function displayName(state: AuctionState, userId: string): string {
  return state.participants.find((p) => p.userId === userId)?.name ?? "A manager";
}

function teamName(opts: AuctionOpts | undefined, teamId: string): string {
  return opts?.nameOf(teamId) ?? teamId;
}

// ---- Clock windows ----------------------------------------------------------

/** Seconds a nominator has to put a nation up. */
export function nominateSeconds(settings: DraftSettings): number {
  return settings.pickSeconds;
}

/** Seconds the bid clock runs on the open lot (a fixed countdown, not reset per bid). */
export function bidSeconds(settings: DraftSettings): number {
  return Math.max(5, settings.bidSeconds || 20);
}

/** Anti-snipe window: a bid landing inside this re-extends the clock to it. */
export function bidExtendSeconds(settings: DraftSettings): number {
  return Math.max(2, settings.bidExtendSeconds || 7);
}

/** Lowest first bid that opens a lot — a fraction of the starting budget. */
export function minOpeningBid(settings: DraftSettings): number {
  return Math.max(1, Math.ceil(MIN_BID_PCT * settings.budget));
}

/** Minimum raise over the standing high bid — a fraction of the starting budget. */
export function raiseStep(settings: DraftSettings): number {
  return Math.max(1, Math.ceil(RAISE_STEP_PCT * settings.budget));
}

// ---- Derived helpers --------------------------------------------------------

export function ownedCount(state: AuctionState, userId: string): number {
  let n = 0;
  for (const w of state.wins) if (w.userId === userId) n++;
  return n;
}

export function squadOfAuction(state: AuctionState, userId: string): string[] {
  return state.wins.filter((w) => w.userId === userId).map((w) => w.teamId);
}

export function slotsRemaining(state: AuctionState, userId: string): number {
  return Math.max(0, state.squadSize - ownedCount(state, userId));
}

export function squadFull(state: AuctionState, userId: string): boolean {
  return slotsRemaining(state, userId) <= 0;
}

export function allSquadsFull(state: AuctionState): boolean {
  return state.participants.every((p) => squadFull(state, p.userId));
}

/**
 * Most a manager may bid right now.
 *  - auction: keep ≥1 credit in reserve for every other slot still to fill, so
 *    a full squad is always affordable.
 *  - hybrid: leftover slots are filled for free, so they can spend it all.
 */
export function maxBidFor(state: AuctionState, userId: string): number {
  const budget = state.budgets[userId] ?? 0;
  if (state.style === "hybrid") return budget;
  const reserve = Math.max(0, slotsRemaining(state, userId) - 1);
  return Math.max(0, budget - reserve);
}

export function nominator(state: AuctionState): string | null {
  return state.nominationOrder[state.nominationIndex] ?? null;
}

/** True when there's nothing left for any manager to buy via the auction. */
export function auctionExhausted(state: AuctionState): boolean {
  if (allSquadsFull(state)) return true;
  if (state.lotPool.length === 0 && state.current === null) return true;
  return false;
}

// ---- Nomination rotation ----------------------------------------------------

/**
 * Next nomination index (cyclic) landing on a manager who still has a slot to
 * fill; -1 when every squad is full.
 */
function nextNominationIndex(state: AuctionState, fromIndex: number): number {
  const n = state.nominationOrder.length;
  if (n === 0) return -1;
  for (let step = 0; step < n; step++) {
    const idx = (fromIndex + step) % n;
    const userId = state.nominationOrder[idx];
    if (!squadFull(state, userId)) return idx;
  }
  return -1;
}

// ---- Build / start ----------------------------------------------------------

export interface CreateAuctionArgs {
  settings: DraftSettings;
  participants: DraftParticipant[];
  poolTeamCount: number;
  /** Every nation id in the pool (the board). */
  allTeamIds: string[];
  ranking: RankingProvider;
  /** Pre-randomised nomination order when orderMode === "random". */
  orderSeed?: string[];
  rng?: () => number;
}

/** Build a fresh auction in the "lobby" state. */
export function createAuction(args: CreateAuctionArgs): AuctionState {
  const { settings, participants, poolTeamCount, allTeamIds, ranking } = args;
  const style: Exclude<DraftStyle, "draft"> = settings.style === "hybrid" ? "hybrid" : "auction";
  const ids = participants.map((p) => p.userId);
  const nominationOrder =
    settings.orderMode === "random" ? args.orderSeed ?? shuffleOrder(ids, args.rng) : ids;

  const squadSize = roundsFor(settings, participants.length, poolTeamCount);

  // The board is the rank-sorted pool capped at `boardSize` (decoupled from
  // squad size). Hybrid auctions only the top `marqueeCount` of that board and
  // free-fills the rest; pure auction puts the whole board on the block.
  const byRank = [...allTeamIds].sort(
    (a, b) => (ranking.rankOf(a) ?? Infinity) - (ranking.rankOf(b) ?? Infinity),
  );
  const boardSize = Math.max(1, Math.min(settings.boardSize || byRank.length, byRank.length));
  const board = byRank.slice(0, boardSize);
  const marquee = Math.max(1, Math.min(settings.marqueeCount, board.length));
  const lotPool = style === "hybrid" ? board.slice(0, marquee) : board.slice();

  return {
    settings,
    participants,
    style,
    squadSize,
    boardTeamIds: board.slice(),
    lotPool,
    recycled: [],
    nominationOrder,
    nominationIndex: 0,
    current: null,
    wins: [],
    budgets: Object.fromEntries(participants.map((p) => [p.userId, settings.budget])),
    status: "lobby",
    deadlineAt: null,
    lastActionAt: 0,
    log: [],
  };
}

/** Begin the auction: lobby → live, land on the first eligible nominator. */
export function startAuction(
  state: AuctionState,
  opts?: AuctionOpts,
  now = Date.now(),
): AuctionState {
  if (state.status !== "lobby") return state;
  const idx = nextNominationIndex(state, 0);
  const started: AuctionState = {
    ...state,
    status: "live",
    nominationIndex: idx < 0 ? 0 : idx,
    deadlineAt: now + nominateSeconds(state.settings) * 1000,
    lastActionAt: now,
    log: [
      ...state.log,
      { kind: "auction_started", at: new Date(now).toISOString(), message: "The Auction Has Begun" },
    ],
  };
  // Degenerate case: nobody has a slot (squadSize 0) → fill + complete at once.
  if (idx < 0) return runFill(started, opts, now);
  return started;
}

// ---- Live transitions -------------------------------------------------------

/**
 * The least a new bid may be right now:
 *  - no lot open → 0 (nothing to bid on yet);
 *  - lot open, no bids → the opening bid (≥10% of budget);
 *  - lot open with a standing bid → high bid + the raise step (≥5% of budget).
 */
export function minNextBid(state: AuctionState): number {
  if (!state.current) return 0;
  if (state.current.highBidder === "") return minOpeningBid(state.settings);
  return state.current.highBid + raiseStep(state.settings);
}

/** True when at least one manager has a slot and can afford an opening bid. */
function anyoneCanBid(state: AuctionState): boolean {
  const open = minOpeningBid(state.settings);
  return state.participants.some(
    (p) => !squadFull(state, p.userId) && maxBidFor(state, p.userId) >= open,
  );
}

/**
 * Put a nation on the block. The lot opens with no bid (highBid 0, highBidder
 * ""); any manager — the nominator included — then bids, the first bid having to
 * clear the opening minimum. The bid clock starts counting down immediately.
 */
export function nominate(
  state: AuctionState,
  userId: string,
  teamId: string,
  opts?: AuctionOpts,
  now = Date.now(),
): AuctionState {
  if (state.status !== "live") return state;
  if (state.current) return state; // a lot is already open
  if (nominator(state) !== userId) return state; // not this manager's turn
  if (squadFull(state, userId)) return state;
  if (!state.lotPool.includes(teamId)) return state; // not auctionable

  const lot: AuctionLot = { teamId, nominatedBy: userId, highBid: 0, highBidder: "" };
  return {
    ...state,
    current: lot,
    lotPool: state.lotPool.filter((id) => id !== teamId),
    deadlineAt: now + bidSeconds(state.settings) * 1000,
    lastActionAt: now,
    log: [
      ...state.log,
      {
        kind: "nominate",
        at: new Date(now).toISOString(),
        userId,
        teamId,
        message: `${displayName(state, userId)} puts ${teamName(opts, teamId)} up for auction`,
      },
    ],
  };
}

/**
 * Raise the leading bid on the open lot. The bid clock is a fixed countdown, so
 * a bid only touches `deadlineAt` when it lands inside the anti-snipe window —
 * then the clock re-extends to `bidExtendSeconds` so nobody can snipe at 0.
 */
export function placeBid(
  state: AuctionState,
  userId: string,
  amount: number,
  opts?: AuctionOpts,
  now = Date.now(),
): AuctionState {
  if (state.status !== "live") return state;
  if (!state.current) return state;
  if (squadFull(state, userId)) return state;
  if (amount < minNextBid(state)) return state; // below the opening/raise floor
  if (amount > maxBidFor(state, userId)) return state; // can't afford

  const lot: AuctionLot = { ...state.current, highBid: amount, highBidder: userId };
  const extendMs = bidExtendSeconds(state.settings) * 1000;
  const remaining = state.deadlineAt != null ? state.deadlineAt - now : 0;
  const deadlineAt = remaining < extendMs ? now + extendMs : state.deadlineAt;
  return {
    ...state,
    current: lot,
    deadlineAt,
    lastActionAt: now,
    log: [
      ...state.log,
      {
        kind: "bid",
        at: new Date(now).toISOString(),
        userId,
        teamId: lot.teamId,
        amount,
        message: `${displayName(state, userId)} bids ${amount} on ${teamName(opts, lot.teamId)}`,
      },
    ],
  };
}

/** Award the open lot to the high bidder and advance to the next nominator. */
function sellCurrent(state: AuctionState, opts: AuctionOpts | undefined, now: number): AuctionState {
  const lot = state.current;
  if (!lot) return state;
  const win: AuctionWin = {
    teamId: lot.teamId,
    userId: lot.highBidder,
    price: lot.highBid,
    nominatedBy: lot.nominatedBy,
    auto: false,
    at: new Date(now).toISOString(),
  };
  const sold: AuctionState = {
    ...state,
    current: null,
    wins: [...state.wins, win],
    budgets: {
      ...state.budgets,
      [lot.highBidder]: (state.budgets[lot.highBidder] ?? 0) - lot.highBid,
    },
    lastActionAt: now,
    log: [
      ...state.log,
      {
        kind: "sold",
        at: new Date(now).toISOString(),
        userId: lot.highBidder,
        teamId: lot.teamId,
        amount: lot.highBid,
        message: `Sold! ${displayName(state, lot.highBidder)} wins ${teamName(opts, lot.teamId)} for ${lot.highBid}`,
      },
    ],
  };

  // Done when squads are full, the lot pool is empty, or nobody can bid again.
  if (allSquadsFull(sold) || sold.lotPool.length === 0 || !anyoneCanBid(sold)) {
    return runFill(sold, opts, now);
  }

  const idx = nextNominationIndex(sold, (sold.nominationIndex + 1) % sold.nominationOrder.length);
  if (idx < 0) return runFill(sold, opts, now);
  return {
    ...sold,
    nominationIndex: idx,
    deadlineAt: now + nominateSeconds(sold.settings) * 1000,
  };
}

/**
 * A lot's clock ran out with no bids. First time, the nation goes back to the
 * tail of the pool for one more chance; if it already had its second airing it's
 * left unsold (the fill draft will hand it out for free at the end).
 */
function recycleCurrent(
  state: AuctionState,
  opts: AuctionOpts | undefined,
  now: number,
): AuctionState {
  const lot = state.current;
  if (!lot) return state;
  const alreadyRecycled = state.recycled.includes(lot.teamId);

  const after: AuctionState = {
    ...state,
    current: null,
    lotPool: alreadyRecycled ? state.lotPool : [...state.lotPool, lot.teamId],
    recycled: alreadyRecycled ? state.recycled : [...state.recycled, lot.teamId],
    lastActionAt: now,
    log: [
      ...state.log,
      {
        kind: "recycle",
        at: new Date(now).toISOString(),
        teamId: lot.teamId,
        message: alreadyRecycled
          ? `No bids for ${teamName(opts, lot.teamId)} — it goes to the free fill draft`
          : `No bids for ${teamName(opts, lot.teamId)} — back on the block later`,
      },
    ],
  };

  if (allSquadsFull(after) || after.lotPool.length === 0 || !anyoneCanBid(after)) {
    return runFill(after, opts, now);
  }
  const idx = nextNominationIndex(after, (after.nominationIndex + 1) % after.nominationOrder.length);
  if (idx < 0) return runFill(after, opts, now);
  return {
    ...after,
    nominationIndex: idx,
    deadlineAt: now + nominateSeconds(after.settings) * 1000,
  };
}

/**
 * Clock expiry. With a lot open it either sells to the leader or, if no bids
 * landed, recycles the nation; otherwise the nomination clock lapsed, so we
 * auto-nominate (or skip) to keep things moving.
 */
export function expireAuction(
  state: AuctionState,
  opts?: AuctionOpts,
  now = Date.now(),
): AuctionState {
  if (state.status !== "live") return state;

  if (state.current) {
    return state.current.highBidder === ""
      ? recycleCurrent(state, opts, now)
      : sellCurrent(state, opts, now);
  }

  // Nomination clock lapsed.
  if (state.lotPool.length === 0 || !anyoneCanBid(state)) return runFill(state, opts, now);

  const who = nominator(state);
  if (!who) return runFill(state, opts, now);

  const pick = nextBotNomination(state, who);
  if (pick) return nominate(state, who, pick, opts, now);

  // This nominator can't open anything affordable — skip to the next eligible.
  const idx = nextNominationIndex(state, (state.nominationIndex + 1) % state.nominationOrder.length);
  if (idx < 0) return runFill(state, opts, now);
  return {
    ...state,
    nominationIndex: idx,
    deadlineAt: now + nominateSeconds(state.settings) * 1000,
    lastActionAt: now,
  };
}

// ---- Fill draft + completion ------------------------------------------------

/**
 * Top every squad up to `squadSize` from the board (best available by rank,
 * since boardTeamIds is rank-sorted), at price 0 / auto = true, then mark the
 * auction complete. Powers hybrid's leftover slots and any stalled auction.
 */
export function runFill(state: AuctionState, opts?: AuctionOpts, now = Date.now()): AuctionState {
  const ownedIds = new Set(state.wins.map((w) => w.teamId));
  if (state.current) ownedIds.add(state.current.teamId);
  const available = state.boardTeamIds.filter((id) => !ownedIds.has(id));
  const owned: Record<string, number> = {};
  for (const p of state.participants) owned[p.userId] = ownedCount(state, p.userId);

  // Snake the hand-outs (forward, then reversed, …) so the best leftovers don't
  // always land with the same player — the luck evens out across passes.
  const wins = state.wins.slice();
  const log = state.log.slice();
  let avIdx = 0;
  let progressed = true;
  let pass = 0;
  while (progressed && avIdx < available.length) {
    progressed = false;
    const lane = pass % 2 === 1 ? [...state.participants].reverse() : state.participants;
    for (const p of lane) {
      if (owned[p.userId] >= state.squadSize) continue;
      if (avIdx >= available.length) break;
      const teamId = available[avIdx++];
      owned[p.userId]++;
      wins.push({
        teamId,
        userId: p.userId,
        price: 0,
        nominatedBy: p.userId,
        auto: true,
        at: new Date(now).toISOString(),
      });
      log.push({
        kind: "fill",
        at: new Date(now).toISOString(),
        userId: p.userId,
        teamId,
        message: `${displayName(state, p.userId)} is handed ${teamName(opts, teamId)} to round out the squad`,
      });
      progressed = true;
    }
    pass++;
  }

  return {
    ...state,
    current: null,
    lotPool: [],
    wins,
    status: "complete",
    deadlineAt: null,
    log: [
      ...log,
      { kind: "complete", at: new Date(now).toISOString(), message: "The Auction Is Complete" },
    ],
  };
}

// ---- Pause / resume / cancel ------------------------------------------------

export function pauseAuction(state: AuctionState, now = Date.now()): AuctionState {
  if (state.status !== "live") return state;
  const remaining = state.deadlineAt != null ? Math.max(0, state.deadlineAt - now) : null;
  return {
    ...state,
    status: "paused",
    deadlineAt: remaining, // stash ms remaining; resume re-anchors it
    log: [...state.log, { kind: "paused", at: new Date(now).toISOString(), message: "Auction paused" }],
  };
}

export function resumeAuction(state: AuctionState, now = Date.now()): AuctionState {
  if (state.status !== "paused") return state;
  const remaining = state.deadlineAt ?? 0;
  return {
    ...state,
    status: "live",
    deadlineAt: now + remaining,
    lastActionAt: now,
    log: [...state.log, { kind: "resumed", at: new Date(now).toISOString(), message: "Auction resumed" }],
  };
}

export function cancelAuction(state: AuctionState, now = Date.now()): AuctionState {
  if (state.status === "complete" || state.status === "cancelled") return state;
  return {
    ...state,
    status: "cancelled",
    current: null,
    deadlineAt: null,
    log: [...state.log, { kind: "cancelled", at: new Date(now).toISOString(), message: "Auction cancelled" }],
  };
}

// ---- Bot decisions ----------------------------------------------------------

/** What a bot manager would pay at most for a nation right now. */
export function botCeilingFor(
  state: AuctionState,
  userId: string,
  teamId: string,
  ranking: RankingProvider,
): number {
  const rating = ranking.ratingOf(teamId) ?? 50; // 0..100, 100 = strongest
  const slots = Math.max(1, slotsRemaining(state, userId));
  const perSlot = (state.budgets[userId] ?? 0) / slots;
  // Marquee sides command up to ~2× an average slot; minnows a fraction of it.
  const ceiling = Math.round(perSlot * (0.5 + (rating / 100) * 1.5));
  return Math.min(maxBidFor(state, userId), Math.max(1, ceiling));
}

/** The bid a bot would place on the open lot, or null to stand pat. */
export function nextBotBid(
  state: AuctionState,
  userId: string,
  ranking: RankingProvider,
): number | null {
  if (!state.current) return null;
  if (squadFull(state, userId)) return null;
  if (state.current.highBidder === userId) return null; // already leading
  const next = minNextBid(state); // opening floor, or high bid + raise step
  if (next > maxBidFor(state, userId)) return null;
  if (next > botCeilingFor(state, userId, state.current.teamId, ranking)) return null;
  return next;
}

/** The nation a bot would nominate on its turn (best available it can open). */
export function nextBotNomination(state: AuctionState, userId: string): string | null {
  if (maxBidFor(state, userId) < minOpeningBid(state.settings)) return null;
  return state.lotPool[0] ?? null; // lotPool stays rank-sorted, best first
}

// ---- Results bridge ---------------------------------------------------------

/**
 * Project a finished auction into a synthetic completed DraftState so the whole
 * post-draft analysis surface (projection.ts + PostDraftAnalysis) can be reused
 * verbatim — it only ever reads squads via squadOf(state, userId).
 */
export function toResultsDraftState(state: AuctionState, now = Date.now()): DraftState {
  const ids = state.participants.map((p) => p.userId);
  const rounds = state.squadSize;
  const order: string[] = [];
  for (let r = 0; r < rounds; r++) for (const id of ids) order.push(id);

  const byUser: Record<string, string[]> = {};
  for (const w of state.wins) (byUser[w.userId] ??= []).push(w.teamId);

  const picks: DraftPick[] = [];
  let overall = 0;
  for (let r = 0; r < rounds; r++) {
    for (let s = 0; s < ids.length; s++) {
      const userId = ids[s];
      const teamId = byUser[userId]?.[r];
      if (teamId) {
        picks.push({
          overall,
          round: r + 1,
          slot: s + 1,
          userId,
          teamId,
          auto: false,
          at: new Date(now).toISOString(),
        });
      }
      overall++;
    }
  }

  return {
    settings: state.settings,
    participants: state.participants,
    rounds,
    order,
    picks,
    currentPickIndex: order.length,
    status: "complete",
    queues: Object.fromEntries(ids.map((id) => [id, [] as string[]])),
    deadlineAt: null,
    log: [],
  };
}

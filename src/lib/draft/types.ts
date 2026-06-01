/**
 * Draft domain types.
 *
 * The draft is a pure state machine: a `DraftState` plus reducer-style
 * transitions (see engine.ts). No React, no I/O — so it can be unit-tested,
 * driven by an offline timer hook, or replayed from Supabase Realtime events.
 */

export type DraftFormat = "snake" | "standard" | "balanced-random";

export type DraftStatus = "configuring" | "lobby" | "live" | "paused" | "complete" | "cancelled";

export type DraftOrderMode = "random" | "manual";

/**
 * How teams are allocated across participants.
 * Legacy field kept only so the one-time settings migration can map old configs.
 */
export type AllocationMode = "all" | "fixed";

/**
 * How many nations each manager ends up with:
 *  - "fixed"     → exactly `teamsPerUser` each.
 *  - "split-all" → divide the whole board (boardSize) evenly.
 *  - "split-top" → divide the top `boardSize` nations evenly (same maths,
 *    different framing for the user — "only the best nations are in play").
 */
export type SquadMode = "fixed" | "split-all" | "split-top";

/** Rounds 2+ pattern when round 1 is a hand-picked manual order. */
export type SubsequentFormat = "snake" | "standard" | "random";

/** Opening bid floor as a fraction of the starting budget. */
export const MIN_BID_PCT = 0.1;
/** Minimum raise over the standing high bid, as a fraction of the starting budget. */
export const RAISE_STEP_PCT = 0.05;

/**
 * How squads are filled:
 *  - "draft"   → classic serpentine/standard pick draft (engine.ts).
 *  - "auction" → managers bid credits to buy nations (auction.ts).
 *  - "hybrid"  → top "marquee" nations are auctioned, the rest snake-drafted.
 */
export type DraftStyle = "draft" | "auction" | "hybrid";

export interface DraftSettings {
  /** Draft style; "draft" is the classic pick draft. */
  style: DraftStyle;
  /** Credits each manager gets in auction / hybrid styles. */
  budget: number;
  /** Hybrid only: how many top-ranked nations go to auction before the draft fills the rest. */
  marqueeCount: number;
  format: DraftFormat;
  /** Seconds on the clock per pick (also the nomination clock for auctions). */
  pickSeconds: number;
  /**
   * Legacy allocation flag — superseded by `squadMode`. Kept so the one-time
   * settings migration can read old configs; new code should read `squadMode`.
   */
  allocationMode: AllocationMode;
  /** How squads are sized: fixed count, split the whole board, or split the top board. */
  squadMode: SquadMode;
  /**
   * Nations on the board / auction block — fully decoupled from `teamsPerUser`.
   * Presets: 48 (all), 24 (top 2 per group), 20, 15, 10.
   */
  boardSize: number;
  /** When squadMode === "fixed", nations each participant ends up with. */
  teamsPerUser: number;
  orderMode: DraftOrderMode;
  /** Hand-picked round-1 order (userIds) when orderMode === "manual". */
  manualFirstRoundOrder?: string[];
  /** Rounds 2+ pattern when round 1 is a manual order. */
  subsequentFormat: SubsequentFormat;
  /** Seconds the bid clock runs on the open lot (auction / hybrid). */
  bidSeconds: number;
  /** Anti-snipe: a late bid inside this window re-extends the clock to it. */
  bidExtendSeconds: number;
  /** Auto-draft the best queued/available team when the clock expires. */
  autoPick: boolean;
  // Optional experience toggles (admin-configurable).
  draftChat: boolean;
  soundEffects: boolean;
  announcements: boolean;
  allowCoAdmins: boolean;
  postDraftTrading: boolean;
  predictionGame: boolean;
  pushNotifications: boolean;
}

export interface DraftParticipant {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}

export interface DraftPick {
  /** 0-based overall pick index. */
  overall: number;
  round: number;
  /** 1-based slot within the round. */
  slot: number;
  userId: string;
  teamId: string;
  /** True when filled by the auto-pick fallback rather than a manual selection. */
  auto: boolean;
  /** ISO timestamp the pick was made. */
  at: string;
}

export interface DraftState {
  settings: DraftSettings;
  participants: DraftParticipant[];
  /** Total rounds (teams each participant ends up with). */
  rounds: number;
  /** Overall pick → userId on the clock (length = rounds × participants). */
  order: string[];
  /** Completed picks, in overall order. */
  picks: DraftPick[];
  /** Index into `order` of the pick currently on the clock. */
  currentPickIndex: number;
  status: DraftStatus;
  /** Personal watchlists, ranked, keyed by userId. */
  queues: Record<string, string[]>;
  /** Epoch ms the current clock expires; null when not running. */
  deadlineAt: number | null;
  /** Audit trail for the ticker / announcements. */
  log: DraftLogEntry[];
}

export type DraftLogKind =
  | "draft_started"
  | "pick"
  | "auto_pick"
  | "paused"
  | "resumed"
  | "cancelled"
  | "complete";

export interface DraftLogEntry {
  kind: DraftLogKind;
  at: string;
  userId?: string;
  teamId?: string;
  /** Pre-rendered human message for the ticker. */
  message: string;
}

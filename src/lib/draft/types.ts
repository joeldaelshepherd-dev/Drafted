/**
 * Draft domain types.
 *
 * The draft is a pure state machine: a `DraftState` plus reducer-style
 * transitions (see engine.ts). No React, no I/O — so it can be unit-tested,
 * driven by an offline timer hook, or replayed from Supabase Realtime events.
 */

export type DraftFormat = "snake" | "standard";

export type DraftStatus = "configuring" | "lobby" | "live" | "paused" | "complete" | "cancelled";

export type DraftOrderMode = "random" | "manual";

/** How teams are allocated across participants. */
export type AllocationMode = "all" | "fixed";

export interface DraftSettings {
  format: DraftFormat;
  /** Seconds on the clock per pick. */
  pickSeconds: number;
  allocationMode: AllocationMode;
  /** When allocationMode === "fixed", teams each participant drafts. */
  teamsPerUser: number;
  orderMode: DraftOrderMode;
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

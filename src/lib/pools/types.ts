/**
 * Pool — a private league a player creates or joins.
 *
 * Demo build: persisted in localStorage (see ./store). TODO(drafted): swap the
 * store for Supabase `pools` + `pool_members` tables. This shape maps closely to
 * the planned schema so the swap stays mechanical.
 */

export type DraftStatus = "not_started" | "in_progress" | "complete";

export interface PoolMember {
  id: string;
  name: string;
}

export interface Pool {
  id: string;
  name: string;
  /** Tournament this pool plays — e.g. "FIFA World Cup 2026". */
  tournamentName: string;
  /** Shareable code others enter to join. */
  inviteCode: string;
  /** Profile id of the creator/admin. */
  adminId: string;
  /** Whether the current (demo) user administers this pool. */
  isAdmin: boolean;
  members: PoolMember[];
  draftStatus: DraftStatus;
  createdAt: string;
}

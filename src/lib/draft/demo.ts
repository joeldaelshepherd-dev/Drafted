/**
 * Offline demo draft — Shepherd Family Syndicate.
 * Lets the draft route render and run a full mock draft with zero backend.
 * Swap createDemoDraft() for Supabase-backed state in production.
 */
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import type { DraftParticipant, DraftSettings, DraftState } from "./types";
import { createDraft, startDraft } from "./lifecycle";

export const DEMO_DRAFT_USER = "00000000-0000-0000-0000-000000000001"; // Joel

export const DEMO_PARTICIPANTS: DraftParticipant[] = [
  { userId: "00000000-0000-0000-0000-000000000001", name: "Joel Shepherd", isAdmin: true },
  { userId: "00000000-0000-0000-0000-000000000002", name: "Kelly Shepherd", isAdmin: true },
  { userId: "00000000-0000-0000-0000-000000000003", name: "Hayley Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000004", name: "Mike Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000005", name: "Luke Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000006", name: "Murray Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000007", name: "Sarah Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000008", name: "Delys Shepherd" },
];

export const DEMO_SETTINGS: DraftSettings = {
  style: "draft",
  budget: 200,
  marqueeCount: 8,
  format: "snake",
  pickSeconds: 60,
  allocationMode: "fixed",
  teamsPerUser: 6,
  orderMode: "manual",
  autoPick: true,
  draftChat: true,
  soundEffects: true,
  announcements: true,
  allowCoAdmins: true,
  postDraftTrading: false,
  predictionGame: true,
  pushNotifications: true,
};

/** A lobby-state demo draft, deterministic order (manual = participant order). */
export function createDemoDraft(): DraftState {
  return createDraft({
    settings: DEMO_SETTINGS,
    participants: DEMO_PARTICIPANTS,
    poolTeamCount: WC2026_TEAMS.length,
  });
}

/** A live demo draft with the clock armed — for the on-the-clock surfaces. */
export function createLiveDemoDraft(now = Date.now()): DraftState {
  return startDraft(createDemoDraft(), now);
}

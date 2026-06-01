import { describe, expect, it } from "vitest";
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import { fifaRanking } from "@/lib/fifa";
import { generateOrder, roundDirection } from "./order";
import {
  applyPick,
  autoPickTeam,
  availableTeams,
  currentDrafter,
  orderTracker,
  picksUntil,
  runAutoPick,
  squadOf,
  upcomingPicks,
  validatePick,
} from "./engine";
import { armClock, createDraft, enqueueTeam, reorderQueue, startDraft } from "./lifecycle";
import { gradeFromRating, projectedStrengths, draftInsights } from "./projection";
import type { DraftParticipant, DraftSettings } from "./types";

const PARTS: DraftParticipant[] = [
  { userId: "u1", name: "Joel" },
  { userId: "u2", name: "Kelly" },
  { userId: "u3", name: "Mike" },
];

const SETTINGS: DraftSettings = {
  style: "draft",
  budget: 200,
  marqueeCount: 8,
  format: "snake",
  pickSeconds: 60,
  allocationMode: "fixed",
  teamsPerUser: 2,
  orderMode: "manual",
  autoPick: true,
  draftChat: false,
  soundEffects: false,
  announcements: false,
  allowCoAdmins: false,
  postDraftTrading: false,
  predictionGame: false,
  pushNotifications: false,
};

const ALL_IDS = WC2026_TEAMS.map((t) => t.id);
const nameOf = (id: string) => WC2026_TEAMS.find((t) => t.id === id)?.name ?? id;
const teamsById = new Map(WC2026_TEAMS.map((t) => [t.id, t]));

function liveDraft() {
  return startDraft(
    createDraft({ settings: SETTINGS, participants: PARTS, poolTeamCount: 6 }),
  );
}

describe("generateOrder", () => {
  it("snakes even rounds so the last picker of R1 picks first in R2", () => {
    const order = generateOrder(["u1", "u2", "u3"], 2, "snake");
    expect(order).toEqual(["u1", "u2", "u3", "u3", "u2", "u1"]);
  });

  it("keeps a constant order for standard format", () => {
    const order = generateOrder(["u1", "u2", "u3"], 2, "standard");
    expect(order).toEqual(["u1", "u2", "u3", "u1", "u2", "u3"]);
  });

  it("reports snake direction per round", () => {
    expect(roundDirection(0, "snake")).toBe("forward");
    expect(roundDirection(1, "snake")).toBe("reverse");
    expect(roundDirection(1, "standard")).toBe("forward");
  });
});

describe("pick flow", () => {
  it("rejects an out-of-turn pick and accepts the drafter on the clock", () => {
    const s = liveDraft();
    expect(currentDrafter(s)).toBe("u1");
    expect(validatePick(s, "u2", "france", ALL_IDS).reason).toBe("not_your_turn");
    const after = applyPick(s, "u1", "france", { allTeamIds: ALL_IDS, nameOf });
    expect(after.picks).toHaveLength(1);
    expect(currentDrafter(after)).toBe("u2");
  });

  it("removes a drafted team from the board and from all queues", () => {
    let s = liveDraft();
    s = enqueueTeam(s, "u2", "france");
    s = applyPick(s, "u1", "france", { allTeamIds: ALL_IDS, nameOf });
    expect(availableTeams(s, ALL_IDS)).not.toContain("france");
    expect(s.queues.u2).not.toContain("france");
  });

  it("blocks drafting an already-taken team", () => {
    let s = liveDraft();
    s = applyPick(s, "u1", "france", { allTeamIds: ALL_IDS, nameOf });
    expect(validatePick(s, "u2", "france", ALL_IDS).reason).toBe("already_drafted");
  });

  it("completes the draft after the final pick", () => {
    let s = liveDraft();
    const picks = ["france", "spain", "argentina", "england", "brazil", "portugal"];
    for (const teamId of picks) {
      s = applyPick(s, currentDrafter(s)!, teamId, { allTeamIds: ALL_IDS, nameOf });
    }
    expect(s.status).toBe("complete");
    expect(s.deadlineAt).toBeNull();
    expect(squadOf(s, "u1")).toEqual(["france", "portugal"]); // snake: R1 first, R2 last
  });
});

describe("auto-pick", () => {
  it("prefers the highest queued available team", () => {
    let s = liveDraft();
    s = enqueueTeam(s, "u1", "ghana"); // rank 74
    s = enqueueTeam(s, "u1", "spain"); // rank 2 — but queue order favours ghana first
    expect(autoPickTeam(s, fifaRanking, ALL_IDS)).toBe("ghana");
  });

  it("falls back to the best available team when the queue is empty", () => {
    const s = liveDraft();
    // France is FIFA #1 → best available.
    expect(autoPickTeam(s, fifaRanking, ALL_IDS)).toBe("france");
  });

  it("runAutoPick applies the choice and advances the clock", () => {
    const s = liveDraft();
    const after = runAutoPick(s, fifaRanking, { allTeamIds: ALL_IDS, nameOf });
    expect(after.picks[0].auto).toBe(true);
    expect(after.picks[0].teamId).toBe("france");
    expect(currentDrafter(after)).toBe("u2");
  });
});

describe("lookahead", () => {
  it("counts picks until a participant is next", () => {
    const s = liveDraft(); // order u1,u2,u3,u3,u2,u1
    expect(picksUntil(s, "u1")).toBe(0);
    expect(picksUntil(s, "u3")).toBe(2);
  });

  it("exposes previous/current/next/on-deck", () => {
    let s = liveDraft();
    s = applyPick(s, "u1", "france", { allTeamIds: ALL_IDS, nameOf });
    const t = orderTracker(s);
    expect(t.previous).toBe("u1");
    expect(t.current).toBe("u2");
    expect(t.next).toBe("u3");
    expect(t.onDeck).toBe("u3");
  });

  it("lists upcoming picks with the on-deck flag", () => {
    const s = liveDraft();
    const next = upcomingPicks(s, 3);
    expect(next.map((p) => p.userId)).toEqual(["u1", "u2", "u3"]);
    expect(next[1].onDeck).toBe(true);
  });
});

describe("clock + queue management", () => {
  it("arms the clock with the configured pick window", () => {
    const s = armClock(liveDraft(), 1_000);
    expect(s.deadlineAt).toBe(1_000 + 60 * 1000);
  });

  it("reorders a queue by index", () => {
    let s = liveDraft();
    s = enqueueTeam(s, "u1", "france");
    s = enqueueTeam(s, "u1", "spain");
    s = enqueueTeam(s, "u1", "brazil");
    s = reorderQueue(s, "u1", 2, 0); // brazil to front
    expect(s.queues.u1).toEqual(["brazil", "france", "spain"]);
  });
});

describe("projection", () => {
  it("grades a strong squad above a weak one", () => {
    let s = liveDraft();
    // u1 grabs elite teams, u3 grabs minnows.
    s = applyPick(s, "u1", "france", { allTeamIds: ALL_IDS, nameOf }); // #1
    s = applyPick(s, "u2", "spain", { allTeamIds: ALL_IDS, nameOf }); // #2
    s = applyPick(s, "u3", "ghana", { allTeamIds: ALL_IDS, nameOf }); // #74
    s = applyPick(s, "u3", "haiti", { allTeamIds: ALL_IDS, nameOf }); // #83 (snake: u3 picks twice)
    s = applyPick(s, "u2", "argentina", { allTeamIds: ALL_IDS, nameOf }); // #3
    s = applyPick(s, "u1", "england", { allTeamIds: ALL_IDS, nameOf }); // #4
    const ranked = projectedStrengths(s, fifaRanking);
    expect(ranked[0].userId).not.toBe("u3");
    expect(ranked[ranked.length - 1].userId).toBe("u3");
  });

  it("maps ratings to letter grades", () => {
    expect(gradeFromRating(95)).toBe("A+");
    expect(gradeFromRating(64)).toBe("B");
    expect(gradeFromRating(10)).toBe("C-");
  });

  it("names the best available team in insights", () => {
    const s = liveDraft();
    const ins = draftInsights(s, fifaRanking, teamsById, availableTeams(s, ALL_IDS));
    expect(ins.bestAvailable?.id).toBe("france");
  });
});

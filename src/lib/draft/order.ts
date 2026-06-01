/**
 * Draft order generation.
 *
 * Standard: every round runs in the same participant order.
 * Snake: even rounds (0-based: 1, 3, 5…) reverse, so the participant who picked
 * last in round 1 picks first in round 2 — the fairness model used by ESPN/NFL
 * fantasy drafts.
 * Balanced random: the lane is freshly reshuffled every round, so nobody is
 * stuck with an early/late slot the whole way through — the luck evens out.
 */
import type { DraftFormat } from "./types";

/**
 * Returns the flat overall-pick → userId sequence.
 * `participantIds` is the round-1 order; `rounds` is teams-per-participant.
 * `rng` is only used by the "balanced-random" format — pass a seeded rng for
 * determinism, and only ever call this client-side (default Math.random is not
 * SSR-safe).
 */
export function generateOrder(
  participantIds: string[],
  rounds: number,
  format: DraftFormat,
  rng: () => number = Math.random,
): string[] {
  const order: string[] = [];
  for (let round = 0; round < rounds; round++) {
    let lane: string[];
    if (format === "balanced-random") {
      lane = shuffleOrder(participantIds, rng);
    } else if (format === "snake" && round % 2 === 1) {
      lane = [...participantIds].reverse();
    } else {
      lane = participantIds;
    }
    order.push(...lane);
  }
  return order;
}

/** Shuffle a copy of the ids (Fisher–Yates). Pass a seeded rng for determinism. */
export function shuffleOrder<T>(ids: T[], rng: () => number = Math.random): T[] {
  const a = ids.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Round (0-based) and slot (1-based) for an overall pick index. */
export function locatePick(overall: number, participantCount: number) {
  return {
    round: Math.floor(overall / participantCount),
    slot: (overall % participantCount) + 1,
  };
}

/**
 * "Snake direction" for a round — drives the UI arrow (→ forward, ← reverse).
 * Standard format is always forward.
 */
export function roundDirection(round: number, format: DraftFormat): "forward" | "reverse" {
  return format === "snake" && round % 2 === 1 ? "reverse" : "forward";
}

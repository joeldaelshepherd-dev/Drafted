import { getWorldCupTeam } from "@/lib/data/wc2026";
import type { Stage } from "@/lib/tournament/types";
import type { BracketMatch, BracketRound, BracketSlot, GroupTable } from "./types";

/**
 * Projected knockout bracket for the 48-team format: 12 group winners + 12
 * runners-up + the 8 best third-placed teams = 32, then R32 → R16 → QF → SF →
 * Final.
 *
 * IMPORTANT: this is an HONEST projection, not a result. With no matches played
 * the group tables are seed-ordered, so qualifiers and every auto-advance fall
 * out of the FIFA ranking. The UI labels this clearly as "projected by seeding".
 *
 * TODO(drafted): once real group results land, (a) qualifiers come from actual
 * final standings and the official third-place allocation grid, and (b)
 * auto-advance is replaced by real knockout scores.
 */

interface Qualifier {
  teamId: string;
  label: string;
  /** FIFA seed — lower is stronger; drives the projection. */
  seed: number;
}

const KO_STAGES: { stage: Stage; label: string; matches: number }[] = [
  { stage: "round_of_32", label: "Round of 32", matches: 16 },
  { stage: "round_of_16", label: "Round of 16", matches: 8 },
  { stage: "quarter_final", label: "Quarter-finals", matches: 4 },
  { stage: "semi_final", label: "Semi-finals", matches: 2 },
  { stage: "final", label: "Final", matches: 1 },
];

function seedOf(teamId: string): number {
  return getWorldCupTeam(teamId)?.fifaRanking ?? 999;
}

/** Standard single-elimination seed order (1 vs lowest, kept apart from 2). */
function bracketSeedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const next = order.length * 2;
    const expanded: number[] = [];
    for (const s of order) {
      expanded.push(s, next + 1 - s);
    }
    order = expanded;
  }
  return order;
}

function pickQualifiers(tables: GroupTable[]): Qualifier[] {
  const winners: Qualifier[] = [];
  const runnersUp: Qualifier[] = [];
  const thirds: Qualifier[] = [];

  for (const table of tables) {
    const first = table.rows[0];
    const second = table.rows[1];
    const third = table.rows[2];
    if (first)
      winners.push({ teamId: first.teamId, label: `Winners ${table.group}`, seed: seedOf(first.teamId) });
    if (second)
      runnersUp.push({
        teamId: second.teamId,
        label: `Runners-up ${table.group}`,
        seed: seedOf(second.teamId),
      });
    if (third)
      thirds.push({ teamId: third.teamId, label: `3rd Group ${table.group}`, seed: seedOf(third.teamId) });
  }

  // 8 best third-placed teams by seed — a clean stand-in for FIFA's allocation grid.
  const bestThirds = [...thirds].sort((a, b) => a.seed - b.seed).slice(0, 8);

  return [...winners, ...runnersUp, ...bestThirds];
}

function slot(q: Qualifier | null): BracketSlot {
  return q ? { teamId: q.teamId, label: q.label } : { teamId: null, label: "TBD" };
}

/** Better seed (lower number) advances; nulls lose to a real qualifier. */
function advance(a: Qualifier | null, b: Qualifier | null): Qualifier | null {
  if (!a) return b;
  if (!b) return a;
  return a.seed <= b.seed ? a : b;
}

export function projectKnockout(tables: GroupTable[]): BracketRound[] {
  const qualifiers = pickQualifiers(tables);
  // Seed the 32-slot bracket by FIFA rank so the tree is deterministic.
  const bySeed = [...qualifiers].sort((a, b) => a.seed - b.seed);
  const order = bracketSeedOrder(32);
  let slots: (Qualifier | null)[] = order.map((seedPos) => bySeed[seedPos - 1] ?? null);

  const rounds: BracketRound[] = [];

  for (const round of KO_STAGES) {
    const matches: BracketMatch[] = [];
    const winners: (Qualifier | null)[] = [];

    for (let i = 0; i < round.matches; i++) {
      const home = slots[i * 2] ?? null;
      const away = slots[i * 2 + 1] ?? null;
      matches.push({
        id: `ko-${round.stage}-${i + 1}`,
        stage: round.stage,
        home: slot(home),
        away: slot(away),
        homeScore: null,
        awayScore: null,
      });
      winners.push(advance(home, away));
    }

    rounds.push({ stage: round.stage, label: round.label, matches });
    slots = winners;
  }

  return rounds;
}

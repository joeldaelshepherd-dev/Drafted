import type { Stage, TournamentConfig } from "./types";

/**
 * FIFA World Cup 2026 — default engine config.
 * Pools may override any of these via `pools.scoring_config` /
 * `pools.prediction_config`; merge with `withPoolOverrides` below.
 */
export const WORLD_CUP_2026: TournamentConfig = {
  groupStage: { win: 3, draw: 1, loss: 0 },
  progression: {
    round_of_32: 2,
    round_of_16: 3,
    quarter_final: 5,
    semi_final: 8,
    final: 12,
    winner: 20,
  },
  prediction: {
    group: 2,
    round_of_32: 3,
    round_of_16: 5,
    quarter_final: 8,
    semi_final: 12,
    final: 20,
  },
  knockoutMultiplier: false,
  groups: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
};

/**
 * Template for the next tournament. Adding a competition is a config object —
 * no engine changes. (Euros = 6 groups, no R32; set those bonuses to 0.)
 */
export const EURO_2028: TournamentConfig = {
  ...WORLD_CUP_2026,
  progression: { ...WORLD_CUP_2026.progression, round_of_32: 0 },
  groups: ["A", "B", "C", "D", "E", "F"],
};

export const KNOCKOUT_STAGES: Stage[] = [
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "final",
];

export function isKnockout(stage: Stage): boolean {
  return stage !== "group";
}

/** Deep-merge pool-level overrides (jsonb) onto a base config. */
export function withPoolOverrides(
  base: TournamentConfig,
  scoring?: Partial<TournamentConfig> | null,
  prediction?: Partial<Pick<TournamentConfig, "prediction">> | null,
): TournamentConfig {
  return {
    ...base,
    ...scoring,
    groupStage: { ...base.groupStage, ...scoring?.groupStage },
    progression: { ...base.progression, ...scoring?.progression },
    prediction: { ...base.prediction, ...prediction?.prediction },
    knockoutMultiplier: scoring?.knockoutMultiplier ?? base.knockoutMultiplier,
  };
}

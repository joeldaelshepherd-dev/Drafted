import type {
  Fixture,
  ScoreEvent,
  Stage,
  TournamentConfig,
} from "./types";
import { isKnockout } from "./config";

/**
 * Pure scoring functions. Given a finished fixture and the teams owned by each
 * user, emit ScoreEvents. No I/O — trivially unit-testable.
 */

type TeamOwners = Map<string, string[]>; // teamId -> userIds who drafted it

function outcome(home: number, away: number): "home" | "away" | "draw" {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

/** Points a single team earns from a finished group-stage result. */
export function teamPointsForResult(
  config: TournamentConfig,
  isHome: boolean,
  home: number,
  away: number,
): { points: number; label: string } {
  const o = outcome(home, away);
  const won = (isHome && o === "home") || (!isHome && o === "away");
  if (o === "draw") return { points: config.groupStage.draw, label: "draw" };
  if (won) return { points: config.groupStage.win, label: "win" };
  return { points: config.groupStage.loss, label: "loss" };
}

/**
 * Evaluate a finished fixture into per-user score events.
 * Handles the optional knockout multiplier for in-KO-stage results.
 */
export function scoreFixture(
  config: TournamentConfig,
  fixture: Fixture,
  owners: TeamOwners,
): ScoreEvent[] {
  if (fixture.status !== "finished") return [];
  if (fixture.homeScore == null || fixture.awayScore == null) return [];
  if (!fixture.homeTeamId || !fixture.awayTeamId) return [];

  const events: ScoreEvent[] = [];
  const multiplier =
    config.knockoutMultiplier && isKnockout(fixture.stage) ? 2 : 1;

  for (const [teamId, isHome] of [
    [fixture.homeTeamId, true],
    [fixture.awayTeamId, false],
  ] as const) {
    const userIds = owners.get(teamId) ?? [];
    if (userIds.length === 0) continue;

    const { points, label } = teamPointsForResult(
      config,
      isHome,
      fixture.homeScore,
      fixture.awayScore,
    );
    const final = points * multiplier;
    if (final === 0) continue;

    for (const userId of userIds) {
      events.push({
        userId,
        teamId,
        fixtureId: fixture.id,
        source: "team_result",
        points: final,
        reason:
          `${label} (${stageLabel(fixture.stage)})` +
          (multiplier > 1 ? " ×2 knockout" : ""),
      });
    }
  }
  return events;
}

/** Bonus awarded once when a team advances to / wins a given round. */
export function progressionBonus(
  config: TournamentConfig,
  reachedStage: Stage,
  isWinner: boolean,
): number {
  if (isWinner) return config.progression.winner;
  switch (reachedStage) {
    case "round_of_32":
      return config.progression.round_of_32;
    case "round_of_16":
      return config.progression.round_of_16;
    case "quarter_final":
      return config.progression.quarter_final;
    case "semi_final":
      return config.progression.semi_final;
    case "final":
      return config.progression.final;
    default:
      return 0;
  }
}

/** Prediction points for a correct call at the given stage. */
export function predictionPoints(
  config: TournamentConfig,
  stage: Stage,
): number {
  return config.prediction[stage] ?? config.prediction.group;
}

export function stageLabel(stage: Stage): string {
  return {
    group: "group",
    round_of_32: "R32",
    round_of_16: "R16",
    quarter_final: "QF",
    semi_final: "SF",
    final: "final",
  }[stage];
}

import { WC2026_GROUPS, teamsInGroup } from "@/lib/data/wc2026";
import type { GroupTable, GroupTableRow, HubFixture } from "./types";

/**
 * Football group tables — distinct from the pool-scoring engine in
 * src/lib/tournament (that ranks pool MEMBERS, not national teams).
 *
 * Only `completed` fixtures move the table; upcoming/live matches leave a team
 * on its zero baseline. Ordering follows the standard group-stage tiebreak
 * chain: points → goal difference → goals for → FIFA seed (a deterministic,
 * honest stand-in for head-to-head until live results exist).
 */

type Mutable = Omit<GroupTableRow, "position">;

function emptyRow(teamId: string): Mutable {
  return {
    teamId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function applyResult(row: Mutable, scored: number, conceded: number): void {
  row.played += 1;
  row.goalsFor += scored;
  row.goalsAgainst += conceded;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  if (scored > conceded) {
    row.won += 1;
    row.points += 3;
  } else if (scored === conceded) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

/**
 * Build all 12 group tables from the fixture list.
 * @param seedOf lower is stronger (FIFA ranking) — final, deterministic tiebreak.
 */
export function computeGroupTables(
  fixtures: HubFixture[],
  seedOf: (teamId: string) => number,
): GroupTable[] {
  return WC2026_GROUPS.map((group) => {
    const rows = new Map<string, Mutable>();
    for (const team of teamsInGroup(group)) rows.set(team.id, emptyRow(team.id));

    const groupFixtures = fixtures.filter(
      (f) => f.groupLabel === group && f.status === "completed",
    );
    for (const f of groupFixtures) {
      if (
        f.homeTeamId == null ||
        f.awayTeamId == null ||
        f.homeScore == null ||
        f.awayScore == null
      ) {
        continue;
      }
      const home = rows.get(f.homeTeamId);
      const away = rows.get(f.awayTeamId);
      if (!home || !away) continue;
      applyResult(home, f.homeScore, f.awayScore);
      applyResult(away, f.awayScore, f.homeScore);
    }

    const ordered = [...rows.values()].sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        seedOf(a.teamId) - seedOf(b.teamId),
    );

    return {
      group,
      rows: ordered.map((r, i) => ({ ...r, position: i + 1 })),
    };
  });
}

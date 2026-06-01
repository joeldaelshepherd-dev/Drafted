import type { Fixture, Stage, Team, TournamentConfig } from "@/lib/tournament/types";
import { isKnockout, KNOCKOUT_STAGES } from "@/lib/tournament/config";
import { teamPointsForResult, stageLabel } from "@/lib/tournament/scoring";
import type {
  BuildMyTeamsInput,
  LiveContext,
  MyTeamCard,
  MyTeamsView,
  OpponentOwnership,
  OwnedFixture,
  PoolMemberLite,
  RivalryContext,
} from "./types";

const STAGE_ORDER: Stage[] = ["group", ...KNOCKOUT_STAGES];

function stageRank(s: Stage): number {
  return STAGE_ORDER.indexOf(s);
}

function ownersOf(roster: BuildMyTeamsInput["roster"]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const r of roster) {
    const list = m.get(r.teamId) ?? [];
    list.push(r.userId);
    m.set(r.teamId, list);
  }
  return m;
}

function fixturesForTeam(fixtures: Fixture[], teamId: string): Fixture[] {
  return fixtures
    .filter((f) => f.homeTeamId === teamId || f.awayTeamId === teamId)
    .sort((a, b) => +new Date(a.kickoffAt) - +new Date(b.kickoffAt));
}

/** Points a single team banks from one finished/live result, knockout-aware. */
function pointsFromResult(
  config: TournamentConfig,
  fixture: Fixture,
  isHome: boolean,
): { points: number; result: "w" | "d" | "l" } {
  const { points, label } = teamPointsForResult(
    config,
    isHome,
    fixture.homeScore ?? 0,
    fixture.awayScore ?? 0,
  );
  const multiplier = config.knockoutMultiplier && isKnockout(fixture.stage) ? 2 : 1;
  const result = label === "win" ? "w" : label === "draw" ? "d" : "l";
  return { points: points * multiplier, result };
}

function resolveOwnership(
  opponent: Team | null,
  owners: Map<string, string[]>,
  membersById: Map<string, PoolMemberLite>,
  currentUserId: string,
): OpponentOwnership {
  if (!opponent) return { kind: "none", label: "Opponent TBD" };
  const ids = owners.get(opponent.id) ?? [];
  if (ids.length === 0) return { kind: "none", label: "No owner" };
  if (ids.includes(currentUserId)) {
    return { kind: "self", label: "Civil war matchup" };
  }
  const member = membersById.get(ids[0]) ?? null;
  return {
    kind: "member",
    member,
    label: member ? `Owned by ${member.name.split(" ")[0]}` : "Owned by a rival",
  };
}

/** Total confirmed team points for a given user across finished fixtures. */
function userConfirmedPoints(
  config: TournamentConfig,
  fixtures: Fixture[],
  teamIds: string[],
): number {
  let total = 0;
  for (const teamId of teamIds) {
    for (const f of fixturesForTeam(fixtures, teamId)) {
      if (f.status !== "finished" || f.homeScore == null || f.awayScore == null) continue;
      total += pointsFromResult(config, f, f.homeTeamId === teamId).points;
    }
  }
  return total;
}

/**
 * Build the full "My Teams" view for one user.
 * Pure: no I/O, no Supabase, no React. Feed it plain rows (live or demo).
 */
export function buildMyTeams(
  config: TournamentConfig,
  input: BuildMyTeamsInput,
): MyTeamsView {
  const { currentUserId, teams, fixtures, roster, members, teamMeta = {} } = input;
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const owners = ownersOf(roster);
  const membersById = new Map(members.map((m) => [m.userId, m]));

  const myTeamIds = roster.filter((r) => r.userId === currentUserId).map((r) => r.teamId);

  // Current matchweek = soonest matchweek with an unfinished fixture.
  const upcomingMatchweeks = fixtures
    .filter((f) => f.status !== "finished" && f.matchweek != null)
    .map((f) => f.matchweek!) as number[];
  const currentMatchweek = upcomingMatchweeks.length ? Math.min(...upcomingMatchweeks) : null;

  const cards: MyTeamCard[] = myTeamIds.map((teamId) => {
    const team = teamById.get(teamId)!;
    const tfx = fixturesForTeam(fixtures, teamId);
    const meta = teamMeta[teamId] ?? {};

    let points = 0;
    let projected = 0;
    const record = { w: 0, d: 0, l: 0 };
    let stage: Stage = "group";
    let live: LiveContext | null = null;

    for (const f of tfx) {
      stage = stageRank(f.stage) > stageRank(stage) ? f.stage : stage;
      const isHome = f.homeTeamId === teamId;

      if (f.status === "finished" && f.homeScore != null && f.awayScore != null) {
        const { points: p, result } = pointsFromResult(config, f, isHome);
        points += p;
        projected += p;
        record[result] += 1;
      } else if (
        (f.status === "live" || f.status === "halftime") &&
        f.homeScore != null &&
        f.awayScore != null
      ) {
        const { points: p } = pointsFromResult(config, f, isHome);
        projected += p;
        const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
        const opponent = opponentId ? teamById.get(opponentId) ?? null : null;
        live = {
          fixture: f,
          isHome,
          opponent,
          pointsIfHolds: p,
          caption: p > 0 ? `+${p} ${p === 1 ? "point" : "points"} if result holds` : "No points on this result yet",
        };
      }
    }

    // Next unfinished fixture → upcoming card.
    const next = tfx.find((f) => f.status === "scheduled" || f.status === "postponed");
    let upcoming: OwnedFixture | null = null;
    if (next) {
      const isHome = next.homeTeamId === teamId;
      const opponentId = isHome ? next.awayTeamId : next.homeTeamId;
      const opponent = opponentId ? teamById.get(opponentId) ?? null : null;
      upcoming = {
        fixture: next,
        isHome,
        opponent,
        ownership: resolveOwnership(opponent, owners, membersById, currentUserId),
      };
    }

    const eliminated = Boolean(meta.eliminated);
    const progressionLabel = eliminated
      ? `Eliminated · ${stageLabel(stage)}`
      : isKnockout(stage)
        ? `Through to ${stageLabel(stage)}`
        : "Group stage";

    return {
      team,
      fifaRanking: meta.fifaRanking ?? null,
      points,
      projectedPoints: projected,
      record,
      stage,
      progressionLabel,
      eliminated,
      qualificationProbability: meta.qualificationProbability ?? null,
      upcoming,
      live,
      insight: null, // filled below once we can rank across cards
    };
  });

  // Insights: relative call-outs across the user's own teams.
  if (cards.length) {
    const best = cards.reduce((a, b) => (b.points > a.points ? b : a));
    for (const c of cards) {
      if (c.eliminated) {
        c.insight = "Eliminated — points are locked in for good.";
      } else if (c === best && best.points > 0) {
        c.insight = "Your top performer so far.";
      } else if (c.live) {
        c.insight = "Live right now — points in play.";
      } else if (c.record.w >= 2) {
        c.insight = `On a ${c.record.w}-win run.`;
      } else if (c.upcoming?.ownership.kind === "self") {
        c.insight = "Civil war — guaranteed points next match.";
      }
    }
  }

  // Summary widgets.
  const totalPoints = cards.reduce((s, c) => s + c.points, 0);
  const projectedPoints = cards.reduce((s, c) => s + c.projectedPoints, 0);
  const activeTeams = cards.filter((c) => !c.eliminated).length;
  const eliminatedTeams = cards.filter((c) => c.eliminated).length;

  const nextCard = cards
    .filter((c) => c.upcoming)
    .sort((a, b) => +new Date(a.upcoming!.fixture.kickoffAt) - +new Date(b.upcoming!.fixture.kickoffAt))[0];

  // Potential points this matchweek = best-case (win) for each owned team playing.
  let potentialPointsThisWeek = 0;
  if (currentMatchweek != null) {
    for (const teamId of myTeamIds) {
      const playing = fixturesForTeam(fixtures, teamId).find(
        (f) => f.matchweek === currentMatchweek && f.status !== "finished",
      );
      if (!playing) continue;
      const mult = config.knockoutMultiplier && isKnockout(playing.stage) ? 2 : 1;
      potentialPointsThisWeek += config.groupStage.win * mult;
    }
  }

  // Closest rivalry: nearest member by confirmed total points.
  let closestRivalry: RivalryContext | null = null;
  const myTotal = userConfirmedPoints(config, fixtures, myTeamIds);
  for (const m of members) {
    if (m.userId === currentUserId) continue;
    const theirTeamIds = roster.filter((r) => r.userId === m.userId).map((r) => r.teamId);
    const theirTotal = userConfirmedPoints(config, fixtures, theirTeamIds);
    const gap = myTotal - theirTotal;
    if (!closestRivalry || Math.abs(gap) < Math.abs(closestRivalry.gap)) {
      closestRivalry = { rival: m, gap };
    }
  }

  // Headline live highlight: the live owned fixture with the most at stake.
  const liveHighlight =
    cards
      .map((c) => c.live)
      .filter((l): l is LiveContext => Boolean(l))
      .sort((a, b) => b.pointsIfHolds - a.pointsIfHolds)[0] ?? null;

  return {
    summary: {
      totalPoints,
      projectedPoints,
      activeTeams,
      eliminatedTeams,
      nextKickoffAt: nextCard?.upcoming?.fixture.kickoffAt ?? null,
      nextKickoffTeam: nextCard?.team ?? null,
      closestRivalry,
      potentialPointsThisWeek,
    },
    cards,
    liveHighlight,
  };
}

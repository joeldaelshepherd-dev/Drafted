/**
 * Team Supporter Dashboard — a factual, per-team view built entirely from the
 * canonical WC2026 dataset + the offline tournament hub. No fabricated squads,
 * scores or news: every value here is derived from the real group draw, FIFA
 * rankings and the seed-ordered group tables. The squad/news tiles in the view
 * layer are honest "coming with live data" placeholders.
 */
import {
  flagUrlFor,
  getWorldCupTeam,
  teamsInGroup,
  type WorldCupTeam,
} from "@/lib/data/wc2026";
import { getDemoTournamentHub } from "@/lib/hub";
import type { GroupTableRow } from "@/lib/hub/types";
import { ordinal } from "@/lib/utils";

/** Nations co-hosting WC2026 — they play group games on home soil. */
const HOST_IDS = new Set(["usa", "canada", "mexico"]);

export interface TeamFixtureView {
  id: string;
  matchday: number;
  venue: string;
  isHome: boolean;
  opponent: WorldCupTeam | null;
  status: "upcoming" | "live" | "completed";
}

export interface TeamInsight {
  label: string;
  value: string;
  tone?: "default" | "good" | "tough";
}

export interface TeamDashboardView {
  team: WorldCupTeam;
  flagUrl: string;
  group: string;
  groupRows: GroupTableRow[];
  position: number;
  isHostNation: boolean;
  groupSeed: number;
  fixtures: TeamFixtureView[];
  projectedRoute: string;
  insights: TeamInsight[];
  talkingPoints: string[];
}

export function getTeamDashboard(teamId: string): TeamDashboardView | null {
  const team = getWorldCupTeam(teamId);
  if (!team) return null;

  const { fixtures: hubFixtures, tables } = getDemoTournamentHub();
  const groupTable = tables.find((t) => t.group === team.groupLabel);
  const groupRows = groupTable?.rows ?? [];
  const ownRow = groupRows.find((r) => r.teamId === team.id);
  const position = ownRow?.position ?? groupRows.length;

  // Seed within the group by FIFA ranking (1 = best-ranked of the four).
  const groupMates = teamsInGroup(team.groupLabel).sort(
    (a, b) => a.fifaRanking - b.fifaRanking,
  );
  const groupSeed = groupMates.findIndex((t) => t.id === team.id) + 1;

  const fixtures: TeamFixtureView[] = hubFixtures
    .filter((f) => f.homeTeamId === team.id || f.awayTeamId === team.id)
    .sort((a, b) => a.matchday - b.matchday)
    .map((f) => {
      const isHome = f.homeTeamId === team.id;
      const opponentId = isHome ? f.awayTeamId : f.homeTeamId;
      return {
        id: f.id,
        matchday: f.matchday,
        venue: f.venue,
        isHome,
        opponent: opponentId ? getWorldCupTeam(opponentId) ?? null : null,
        status: f.status,
      };
    });

  const opener = fixtures.find((f) => f.matchday === 1)?.opponent ?? null;

  // Toughest test = best-ranked opponent in the group (lowest FIFA number).
  const opponents = groupMates.filter((t) => t.id !== team.id);
  const toughest = opponents.reduce<WorldCupTeam | null>((best, t) => {
    if (!best || t.fifaRanking < best.fifaRanking) return t;
    return best;
  }, null);

  const isHostNation = HOST_IDS.has(team.id);

  const projectedRoute = routeFor(groupSeed, team);

  const insights: TeamInsight[] = [
    { label: "FIFA world ranking", value: `#${team.fifaRanking}` },
    {
      label: "Group seed",
      value: `${ordinal(groupSeed)} of 4`,
      tone: groupSeed === 1 ? "good" : groupSeed === 4 ? "tough" : "default",
    },
    {
      label: "Opening match",
      value: opener ? `vs ${opener.name}` : "TBD",
    },
    {
      label: "Toughest test",
      value: toughest ? `${toughest.name} (#${toughest.fifaRanking})` : "—",
      tone: "tough",
    },
    { label: "Confederation", value: team.confederation },
    {
      label: isHostNation ? "Status" : "Group",
      value: isHostNation ? "Host nation" : `Group ${team.groupLabel}`,
      tone: isHostNation ? "good" : "default",
    },
  ];

  const talkingPoints = buildTalkingPoints({
    team,
    groupSeed,
    opener,
    toughest,
    isHostNation,
    fixtureCount: fixtures.length,
  });

  return {
    team,
    flagUrl: flagUrlFor(team),
    group: team.groupLabel,
    groupRows,
    position,
    isHostNation,
    groupSeed,
    fixtures,
    projectedRoute,
    insights,
    talkingPoints,
  };
}

function routeFor(groupSeed: number, team: WorldCupTeam): string {
  switch (groupSeed) {
    case 1:
      return `As the top seed in Group ${team.groupLabel}, ${team.name} are favoured to win the group on current FIFA seeding and carry that into a kinder last-32 tie.`;
    case 2:
      return `Seeded second in Group ${team.groupLabel}, ${team.name} should be in the qualification mix — a top-two finish books a last-32 place on current seeding.`;
    case 3:
      return `Seeded third in Group ${team.groupLabel}, ${team.name} will likely be chasing one of the best-third-place spots to reach the last 32.`;
    default:
      return `As the lowest seed in Group ${team.groupLabel}, ${team.name} are the underdogs on paper — an early upset would transform their last-32 hopes.`;
  }
}

function buildTalkingPoints(args: {
  team: WorldCupTeam;
  groupSeed: number;
  opener: WorldCupTeam | null;
  toughest: WorldCupTeam | null;
  isHostNation: boolean;
  fixtureCount: number;
}): string[] {
  const { team, groupSeed, opener, toughest, isHostNation, fixtureCount } = args;
  const points: string[] = [];

  points.push(
    `${team.name} sit #${team.fifaRanking} in the FIFA world ranking and enter as the ${ordinal(groupSeed)} seed in Group ${team.groupLabel}.`,
  );

  if (isHostNation) {
    points.push(
      `As a co-host, ${team.name} play their group fixtures on home soil — a real edge over the three-match group stage.`,
    );
  }

  if (opener) {
    points.push(
      `The campaign opens against ${opener.name} — a matchday-one result sets the tone for the group.`,
    );
  }

  if (toughest) {
    points.push(
      `The standout group test looks like ${toughest.name}, the best-ranked side ${team.name} face at #${toughest.fifaRanking}.`,
    );
  }

  points.push(
    `${fixtureCount} group fixtures to navigate before the knockouts — top two go through automatically, with the best four third-placed teams also advancing.`,
  );

  return points;
}

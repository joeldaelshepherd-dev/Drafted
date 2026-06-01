/**
 * Offline demo dataset for the My Teams dashboard.
 * Mirrors the "Shepherd Family Syndicate" seed so the route renders with no
 * Supabase connection. Swap `getMyTeamsInput()` for real queries in production
 * (see TODO in src/app/pools/[poolId]/my-teams/page.tsx).
 */
import type { Fixture, Team } from "@/lib/tournament/types";
import { WORLD_CUP_2026 } from "@/lib/tournament/config";
import { buildMyTeams } from "./build";
import type { BuildMyTeamsInput, MyTeamsView, PoolMemberLite, TeamMeta } from "./types";

export const DEMO_CURRENT_USER = "00000000-0000-0000-0000-000000000001"; // Joel

const flag = (code: string) => `https://flagcdn.com/${code}.svg`;

const T = (id: string, name: string, shortCode: string, group: string, code: string): Team => ({
  id,
  name,
  shortCode,
  flagUrl: flag(code),
  groupLabel: group,
});

const TEAMS: Team[] = [
  T("argentina", "Argentina", "ARG", "A", "ar"),
  T("saudi", "Saudi Arabia", "KSA", "A", "sa"),
  T("spain", "Spain", "ESP", "E", "es"),
  T("japan", "Japan", "JPN", "E", "jp"),
  T("croatia", "Croatia", "CRO", "E", "hr"),
  T("germany", "Germany", "GER", "G", "de"),
  T("mexico", "Mexico", "MEX", "G", "mx"),
  T("ghana", "Ghana", "GHA", "H", "gh"),
  T("portugal", "Portugal", "POR", "H", "pt"),
  T("nigeria", "Nigeria", "NGA", "A", "ng"),
  T("france", "France", "FRA", "D", "fr"),
  T("denmark", "Denmark", "DEN", "D", "dk"),
  T("brazil", "Brazil", "BRA", "F", "br"),
  T("korea", "South Korea", "KOR", "F", "kr"),
];

const MEMBERS: PoolMemberLite[] = [
  { userId: "00000000-0000-0000-0000-000000000001", name: "Joel Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000002", name: "Kelly Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000003", name: "Hayley Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000004", name: "Mike Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000005", name: "Luke Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000006", name: "Murray Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000007", name: "Sarah Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000008", name: "Delys Shepherd" },
  { userId: "00000000-0000-0000-0000-000000000009", name: "Bridget Shepherd" },
];

const ROSTER: BuildMyTeamsInput["roster"] = [
  // Joel — the dashboard owner.
  { userId: "00000000-0000-0000-0000-000000000001", teamId: "argentina" },
  { userId: "00000000-0000-0000-0000-000000000001", teamId: "spain" },
  { userId: "00000000-0000-0000-0000-000000000001", teamId: "croatia" },
  { userId: "00000000-0000-0000-0000-000000000001", teamId: "ghana" },
  // Rivals — drive opponent-ownership labels + rivalry maths.
  { userId: "00000000-0000-0000-0000-000000000006", teamId: "nigeria" }, // Murray
  { userId: "00000000-0000-0000-0000-000000000004", teamId: "portugal" }, // Mike
  { userId: "00000000-0000-0000-0000-000000000002", teamId: "france" }, // Kelly
  { userId: "00000000-0000-0000-0000-000000000007", teamId: "brazil" }, // Sarah
  { userId: "00000000-0000-0000-0000-000000000003", teamId: "japan" }, // Hayley
  { userId: "00000000-0000-0000-0000-000000000005", teamId: "denmark" }, // Luke
  // mexico is deliberately undrafted → "No owner".
];

const TEAM_META: Record<string, TeamMeta> = {
  argentina: { fifaRanking: 1, qualificationProbability: 0.93 },
  spain: { fifaRanking: 8, qualificationProbability: 0.86 },
  croatia: { fifaRanking: 10, qualificationProbability: 0.71 },
  germany: { fifaRanking: 16, qualificationProbability: 0.64 },
  ghana: { fifaRanking: 61, eliminated: true, qualificationProbability: 0 },
};

const hours = (n: number) => n * 3600_000;

function buildFixtures(now: number): Fixture[] {
  const iso = (ms: number) => new Date(now + ms).toISOString();
  return [
    // MW1 — finished
    {
      id: "fx-arg-ksa",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(-hours(26)),
      status: "finished",
      homeTeamId: "argentina",
      awayTeamId: "saudi",
      homeScore: 2,
      awayScore: 1,
      minute: 90,
    },
    {
      id: "fx-gha-por",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(-hours(24)),
      status: "finished",
      homeTeamId: "ghana",
      awayTeamId: "portugal",
      homeScore: 0,
      awayScore: 2,
      minute: 90,
    },
    {
      id: "fx-fra-den",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(-hours(22)),
      status: "finished",
      homeTeamId: "france",
      awayTeamId: "denmark",
      homeScore: 2,
      awayScore: 0,
      minute: 90,
    },
    {
      id: "fx-bra-kor",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(-hours(20)),
      status: "finished",
      homeTeamId: "brazil",
      awayTeamId: "korea",
      homeScore: 3,
      awayScore: 1,
      minute: 90,
    },
    // MW1 — live: Spain leading Japan
    {
      id: "fx-esp-jpn",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(-hours(1)),
      status: "live",
      homeTeamId: "spain",
      awayTeamId: "japan",
      homeScore: 1,
      awayScore: 0,
      minute: 67,
    },
    // MW1 — scheduled soon: Germany (soonest owned kickoff)
    {
      id: "fx-ger-mex",
      stage: "group",
      matchweek: 1,
      kickoffAt: iso(hours(3)),
      status: "scheduled",
      homeTeamId: "germany",
      awayTeamId: "mexico",
      homeScore: null,
      awayScore: null,
      minute: null,
    },
    // MW2 — scheduled: Argentina vs Nigeria (owned by Murray)
    {
      id: "fx-arg-nga",
      stage: "group",
      matchweek: 2,
      kickoffAt: iso(hours(26)),
      status: "scheduled",
      homeTeamId: "argentina",
      awayTeamId: "nigeria",
      homeScore: null,
      awayScore: null,
      minute: null,
    },
    // MW2 — scheduled: Spain vs Croatia (both Joel → civil war)
    {
      id: "fx-esp-cro",
      stage: "group",
      matchweek: 2,
      kickoffAt: iso(hours(50)),
      status: "scheduled",
      homeTeamId: "spain",
      awayTeamId: "croatia",
      homeScore: null,
      awayScore: null,
      minute: null,
    },
  ];
}

export function getMyTeamsInput(now = Date.now()): BuildMyTeamsInput {
  // Germany isn't in Joel's roster but appears as an upcoming opponent context;
  // include it so the team lookup resolves. Joel owns it for the demo.
  return {
    currentUserId: DEMO_CURRENT_USER,
    teams: TEAMS,
    fixtures: buildFixtures(now),
    roster: [...ROSTER, { userId: DEMO_CURRENT_USER, teamId: "germany" }],
    members: MEMBERS,
    teamMeta: TEAM_META,
  };
}

export function getDemoMyTeams(now = Date.now()): MyTeamsView {
  return buildMyTeams(WORLD_CUP_2026, getMyTeamsInput(now));
}

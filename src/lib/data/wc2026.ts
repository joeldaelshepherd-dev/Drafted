/**
 * FIFA World Cup 2026 — real tournament dataset.
 *
 * Source of truth for the 48-team field: official group draw, FIFA/Coca-Cola
 * Men's World Ranking, and confederation membership (grounding PDFs supplied by
 * the pool admin). This is static reference data — the live provider layer
 * (src/lib/football) overlays real-time scores/standings on top of these teams.
 *
 * Kept deliberately free of React/Supabase so the draft engine, ranking service,
 * and tournament hub can all consume the same canonical list.
 */
import type { Team } from "@/lib/tournament/types";

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";

export interface WorldCupTeam {
  /** Stable slug id used as a primary key across the app. */
  id: string;
  name: string;
  shortCode: string;
  /** 2-letter region code for https://flagcdn.com/{code}.svg */
  flagCode: string;
  groupLabel: string;
  confederation: Confederation;
  /** FIFA/Coca-Cola Men's World Ranking at the time of the draw. */
  fifaRanking: number;
}

const flag = (code: string) => `https://flagcdn.com/${code}.svg`;

/**
 * The complete WC2026 field, grouped A–L exactly as drawn. Rankings are the
 * official FIFA world ranking; do not edit by hand — refresh from the provider.
 */
export const WC2026_TEAMS: WorldCupTeam[] = [
  // Group A
  team("mexico", "Mexico", "MEX", "mx", "A", "CONCACAF", 15),
  team("south-africa", "South Africa", "RSA", "za", "A", "CAF", 60),
  team("korea-republic", "Korea Republic", "KOR", "kr", "A", "AFC", 25),
  team("czechia", "Czechia", "CZE", "cz", "A", "UEFA", 41),
  // Group B
  team("canada", "Canada", "CAN", "ca", "B", "CONCACAF", 30),
  team("bosnia", "Bosnia and Herzegovina", "BIH", "ba", "B", "UEFA", 65),
  team("qatar", "Qatar", "QAT", "qa", "B", "AFC", 55),
  team("switzerland", "Switzerland", "SUI", "ch", "B", "UEFA", 19),
  // Group C
  team("brazil", "Brazil", "BRA", "br", "C", "CONMEBOL", 6),
  team("morocco", "Morocco", "MAR", "ma", "C", "CAF", 8),
  team("haiti", "Haiti", "HAI", "ht", "C", "CONCACAF", 83),
  team("scotland", "Scotland", "SCO", "gb-sct", "C", "UEFA", 43),
  // Group D
  team("usa", "USA", "USA", "us", "D", "CONCACAF", 16),
  team("paraguay", "Paraguay", "PAR", "py", "D", "CONMEBOL", 40),
  team("australia", "Australia", "AUS", "au", "D", "AFC", 27),
  team("turkiye", "Türkiye", "TUR", "tr", "D", "UEFA", 22),
  // Group E
  team("germany", "Germany", "GER", "de", "E", "UEFA", 10),
  team("curacao", "Curaçao", "CUW", "cw", "E", "CONCACAF", 82),
  team("cote-divoire", "Côte d'Ivoire", "CIV", "ci", "E", "CAF", 34),
  team("ecuador", "Ecuador", "ECU", "ec", "E", "CONMEBOL", 23),
  // Group F
  team("netherlands", "Netherlands", "NED", "nl", "F", "UEFA", 7),
  team("japan", "Japan", "JPN", "jp", "F", "AFC", 18),
  team("sweden", "Sweden", "SWE", "se", "F", "UEFA", 38),
  team("tunisia", "Tunisia", "TUN", "tn", "F", "CAF", 44),
  // Group G
  team("belgium", "Belgium", "BEL", "be", "G", "UEFA", 9),
  team("egypt", "Egypt", "EGY", "eg", "G", "CAF", 28),
  team("iran", "IR Iran", "IRN", "ir", "G", "AFC", 21),
  team("new-zealand", "New Zealand", "NZL", "nz", "G", "OFC", 85),
  // Group H
  team("spain", "Spain", "ESP", "es", "H", "UEFA", 2),
  team("cabo-verde", "Cabo Verde", "CPV", "cv", "H", "CAF", 69),
  team("saudi-arabia", "Saudi Arabia", "KSA", "sa", "H", "AFC", 61),
  team("uruguay", "Uruguay", "URU", "uy", "H", "CONMEBOL", 17),
  // Group I
  team("france", "France", "FRA", "fr", "I", "UEFA", 1),
  team("senegal", "Senegal", "SEN", "sn", "I", "CAF", 14),
  team("iraq", "Iraq", "IRQ", "iq", "I", "AFC", 57),
  team("norway", "Norway", "NOR", "no", "I", "UEFA", 31),
  // Group J
  team("argentina", "Argentina", "ARG", "ar", "J", "CONMEBOL", 3),
  team("algeria", "Algeria", "ALG", "dz", "J", "CAF", 29),
  team("austria", "Austria", "AUT", "at", "J", "UEFA", 24),
  team("jordan", "Jordan", "JOR", "jo", "J", "AFC", 63),
  // Group K
  team("portugal", "Portugal", "POR", "pt", "K", "UEFA", 5),
  team("congo-dr", "Congo DR", "COD", "cd", "K", "CAF", 46),
  team("uzbekistan", "Uzbekistan", "UZB", "uz", "K", "AFC", 50),
  team("colombia", "Colombia", "COL", "co", "K", "CONMEBOL", 13),
  // Group L
  team("england", "England", "ENG", "gb-eng", "L", "UEFA", 4),
  team("croatia", "Croatia", "CRO", "hr", "L", "UEFA", 11),
  team("ghana", "Ghana", "GHA", "gh", "L", "CAF", 74),
  team("panama", "Panama", "PAN", "pa", "L", "CONCACAF", 33),
];

function team(
  id: string,
  name: string,
  shortCode: string,
  flagCode: string,
  groupLabel: string,
  confederation: Confederation,
  fifaRanking: number,
): WorldCupTeam {
  return { id, name, shortCode, flagCode, groupLabel, confederation, fifaRanking };
}

/** Group letters in draw order. */
export const WC2026_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

/** 16 official host cities — used as venue labels until the live schedule lands. */
export const WC2026_HOST_CITIES = [
  "Mexico City",
  "Guadalajara",
  "Monterrey",
  "Toronto",
  "Vancouver",
  "Atlanta",
  "Boston",
  "Dallas",
  "Houston",
  "Kansas City",
  "Los Angeles",
  "Miami",
  "New York / New Jersey",
  "Philadelphia",
  "San Francisco Bay Area",
  "Seattle",
] as const;

const TEAM_BY_ID = new Map(WC2026_TEAMS.map((t) => [t.id, t]));

export function getWorldCupTeam(id: string): WorldCupTeam | undefined {
  return TEAM_BY_ID.get(id);
}

export function teamsInGroup(group: string): WorldCupTeam[] {
  return WC2026_TEAMS.filter((t) => t.groupLabel === group);
}

/** flagcdn URL for a team — convenience for view-models. */
export function flagUrlFor(team: WorldCupTeam): string {
  return flag(team.flagCode);
}

/** Adapt a dataset team to the engine's tournament-agnostic Team shape. */
export function toEngineTeam(t: WorldCupTeam): Team {
  return {
    id: t.id,
    name: t.name,
    shortCode: t.shortCode,
    flagUrl: flag(t.flagCode),
    groupLabel: t.groupLabel,
  };
}

/** All 48 teams as engine Team records. */
export function worldCupEngineTeams(): Team[] {
  return WC2026_TEAMS.map(toEngineTeam);
}

/** Map of teamId → FIFA ranking, for the ranking provider + draft engine. */
export function worldCupRankings(): Record<string, number> {
  return Object.fromEntries(WC2026_TEAMS.map((t) => [t.id, t.fifaRanking]));
}

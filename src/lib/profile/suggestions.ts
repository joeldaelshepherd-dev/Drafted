/**
 * Smart, football-themed suggestions for nicknames and avatars.
 *
 * Deterministic by design — output is a pure function of the inputs, so it's
 * SSR-safe (no hydration mismatch) and stable across renders. This is a
 * rule-based stand-in for true AI generation; once an image/text model is wired
 * up it can replace these generators without changing the call sites.
 */
import { getWorldCupTeam } from "@/lib/data/wc2026";
import type { AvatarConfig } from "./types";

const NOUNS = [
  "Goal",
  "Striker",
  "Keeper",
  "Maestro",
  "Engine",
  "Wall",
  "Rocket",
  "Magic",
  "Sniper",
  "Wizard",
  "General",
  "Captain",
];

const ADJS = [
  "Clinical",
  "Lethal",
  "Iron",
  "Golden",
  "Rapid",
  "Silent",
  "Fearless",
  "Mighty",
  "Cool",
  "Classic",
];

/** A short, recognisable epithet for popular sides. */
const TEAM_EPITHETS: Record<string, string> = {
  brazil: "Samba",
  argentina: "Albiceleste",
  england: "Lion",
  france: "Les Bleus",
  spain: "Roja",
  germany: "Panzer",
  portugal: "Seleção",
  netherlands: "Oranje",
  italy: "Azzurri",
  "south-africa": "Bafana",
  morocco: "Atlas",
  japan: "Samurai",
  usa: "Stars",
  mexico: "Tri",
  croatia: "Vatreni",
};

function cap(s: string): string {
  const t = s.trim();
  return t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
}

export function suggestNicknames(input: {
  firstName: string;
  lastName: string;
  supportedTeamIds: string[];
}): string[] {
  const first = cap(input.firstName) || "Player";
  const last = cap(input.lastName);
  const fi = (input.firstName.trim()[0] ?? "P").toUpperCase();
  const li = (input.lastName.trim()[0] ?? "").toUpperCase();
  const seed = first.length + last.length + input.supportedTeamIds.length;

  const out: string[] = [];

  // Team-themed first — feels the most personal.
  for (const id of input.supportedTeamIds) {
    const ep = TEAM_EPITHETS[id];
    const team = getWorldCupTeam(id);
    if (ep) out.push(`${ep} ${first}`);
    else if (team) out.push(`${first} ${team.shortCode}`);
  }

  out.push(`${first} ${NOUNS[seed % NOUNS.length]}`);
  out.push(`${ADJS[seed % ADJS.length]} ${last || first}`);
  out.push(`${first} the ${NOUNS[(seed + 4) % NOUNS.length]}`);
  out.push(`${fi}${li}${10 + (seed % 89)}`);
  out.push(`Captain ${first}`);
  out.push(`${first}inho`);
  out.push(`${ADJS[(seed + 5) % ADJS.length]} ${first}`);

  return Array.from(new Set(out.map((s) => s.trim()).filter(Boolean))).slice(0, 8);
}

const JERSEY_COLORS = [
  "#22d38a",
  "#f5c542",
  "#f87171",
  "#3b82f6",
  "#a855f7",
  "#fb923c",
  "#14b8a6",
  "#ec4899",
];

export function suggestAvatars(input: {
  firstName: string;
  supportedTeamIds: string[];
}): AvatarConfig[] {
  const seed = input.firstName.trim().length;
  const presets: AvatarConfig[] = [];

  for (let i = 0; i < 5; i++) {
    presets.push({
      style: "jersey",
      color: JERSEY_COLORS[(seed + i) % JERSEY_COLORS.length],
      number: 1 + ((seed + i * 7) % 29),
      teamId: null,
    });
  }

  // Crest avatars for the teams they support.
  for (const id of input.supportedTeamIds.slice(0, 3)) {
    presets.push({ style: "crest", color: "#0e111a", teamId: id, number: null });
  }

  return presets;
}

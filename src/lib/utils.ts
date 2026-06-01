import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Initials for avatar fallbacks. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Compact ordinal: 1 → 1st, 2 → 2nd … */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Rank movement direction vs a previous rank. */
export function rankDelta(rank: number, previous: number | null) {
  if (previous == null) return { dir: "same" as const, amount: 0 };
  if (previous > rank) return { dir: "up" as const, amount: previous - rank };
  if (previous < rank) return { dir: "down" as const, amount: rank - previous };
  return { dir: "same" as const, amount: 0 };
}

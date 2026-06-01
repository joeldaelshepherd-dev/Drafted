import { WC2026_GROUPS, WC2026_HOST_CITIES, teamsInGroup } from "@/lib/data/wc2026";
import type { HubFixture } from "./types";

/**
 * Real group-stage schedule for all 12 WC2026 groups.
 *
 * The tournament has not kicked off (see src/lib/hub/demo), so every fixture is
 * emitted as `upcoming` with null scores — we never fabricate results. Only the
 * pairings, matchdays, and venues are real; live scores/kickoff times are
 * overlaid later by the football provider.
 *
 * TODO(drafted): replace with the official FIFA match schedule (exact kickoff
 * datetimes + assigned stadiums) from the live football API once published.
 */

/**
 * Single round-robin for a 4-team group, indexed into the group's team list.
 * Each matchday plays two matches; across three matchdays every team meets
 * every other exactly once (6 matches total).
 */
const RR_PAIRS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [0, 3],
    [1, 2],
  ],
  [
    [0, 2],
    [3, 1],
  ],
  [
    [0, 1],
    [2, 3],
  ],
];

/** Build the full 72-match group stage (12 groups × 6 matches). */
export function generateGroupFixtures(): HubFixture[] {
  const fixtures: HubFixture[] = [];
  let venueIndex = 0;

  for (const group of WC2026_GROUPS) {
    const teams = teamsInGroup(group);
    if (teams.length < 4) continue;

    RR_PAIRS.forEach((pairs, dayIndex) => {
      const matchday = dayIndex + 1;
      for (const [homeIdx, awayIdx] of pairs) {
        const home = teams[homeIdx];
        const away = teams[awayIdx];
        const venue = WC2026_HOST_CITIES[venueIndex % WC2026_HOST_CITIES.length];
        venueIndex += 1;

        fixtures.push({
          id: `grp-${group}-md${matchday}-${home.id}-${away.id}`,
          stage: "group",
          groupLabel: group,
          matchday,
          venue,
          homeTeamId: home.id,
          awayTeamId: away.id,
          homeScore: null,
          awayScore: null,
          status: "upcoming",
          minute: null,
        });
      }
    });
  }

  return fixtures;
}

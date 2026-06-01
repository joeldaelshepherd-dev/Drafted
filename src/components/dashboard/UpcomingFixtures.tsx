"use client";

import { useMemo } from "react";
import { Flag } from "@/components/ui";
import { flagUrlFor, getWorldCupTeam } from "@/lib/data/wc2026";
import { getDemoTournamentHub } from "@/lib/hub";

function Side({ teamId }: { teamId: string | null }) {
  const team = teamId ? getWorldCupTeam(teamId) : undefined;
  return (
    <div className="flex items-center gap-2">
      <Flag url={team ? flagUrlFor(team) : null} code={team?.shortCode} size="sm" />
      <span className="text-sm font-semibold text-ink">{team?.shortCode ?? "TBD"}</span>
    </div>
  );
}

export function UpcomingFixtures({ limit = 6 }: { limit?: number }) {
  const fixtures = useMemo(() => {
    const { fixtures } = getDemoTournamentHub();
    return fixtures
      .filter((f) => f.status === "upcoming" && f.matchday === 1 && f.homeTeamId && f.awayTeamId)
      .slice(0, limit);
  }, [limit]);

  if (fixtures.length === 0) {
    return <p className="text-sm text-ink-faint">Fixtures appear once the schedule is confirmed.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fixtures.map((f) => (
        <div key={f.id} className="glass flex items-center justify-between gap-3 p-3">
          <Side teamId={f.homeTeamId} />
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              {f.groupLabel ? `Grp ${f.groupLabel}` : "KO"}
            </span>
            <span className="text-xs font-black text-ink-muted">v</span>
          </div>
          <Side teamId={f.awayTeamId} />
        </div>
      ))}
    </div>
  );
}

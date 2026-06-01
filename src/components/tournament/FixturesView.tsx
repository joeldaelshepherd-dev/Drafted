"use client";

import { useMemo, useState } from "react";
import { Flag } from "@/components/ui";
import { WC2026_GROUPS, flagUrlFor, getWorldCupTeam } from "@/lib/data/wc2026";
import type { HubFixture, HubFixtureStatus } from "@/lib/hub/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<HubFixtureStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: "bg-white/8 text-ink-muted" },
  live: { label: "Live", className: "bg-loss/20 text-loss animate-pulse-live" },
  completed: { label: "FT", className: "bg-brand/15 text-brand" },
};

type MatchdayFilter = "all" | 1 | 2 | 3;

function TeamRow({ teamId, score }: { teamId: string | null; score: number | null }) {
  const team = teamId ? getWorldCupTeam(teamId) : undefined;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Flag url={team ? flagUrlFor(team) : null} code={team?.shortCode} size="md" />
        <span className="text-sm font-semibold text-ink">{team?.name ?? "TBD"}</span>
      </div>
      <span className="font-display text-lg font-black tabular-nums text-ink">
        {score ?? "–"}
      </span>
    </div>
  );
}

function FixtureCard({ fixture }: { fixture: HubFixture }) {
  const status = STATUS_META[fixture.status];
  return (
    <div className="glass space-y-2.5 p-3.5">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        <span>
          {fixture.groupLabel ? `Group ${fixture.groupLabel} · MD${fixture.matchday}` : "Knockout"}
        </span>
        <span className={cn("pill", status.className)}>
          {fixture.status === "live" && fixture.minute != null ? `${fixture.minute}'` : status.label}
        </span>
      </div>
      <div className="space-y-1.5">
        <TeamRow teamId={fixture.homeTeamId} score={fixture.homeScore} />
        <TeamRow teamId={fixture.awayTeamId} score={fixture.awayScore} />
      </div>
      <p className="text-[11px] text-ink-faint">{fixture.venue}</p>
    </div>
  );
}

export function FixturesView({ fixtures }: { fixtures: HubFixture[] }) {
  const [matchday, setMatchday] = useState<MatchdayFilter>("all");
  const [group, setGroup] = useState<string>("all");

  const filtered = useMemo(
    () =>
      fixtures.filter(
        (f) =>
          (matchday === "all" || f.matchday === matchday) &&
          (group === "all" || f.groupLabel === group),
      ),
    [fixtures, matchday, group],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(["all", 1, 2, 3] as const).map((md) => (
            <button
              key={md}
              onClick={() => setMatchday(md)}
              className={cn(
                "pill tap transition",
                matchday === md ? "bg-brand text-white" : "bg-white/8 text-ink-muted",
              )}
            >
              {md === "all" ? "All matchdays" : `MD${md}`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setGroup("all")}
            className={cn(
              "pill tap transition",
              group === "all" ? "bg-brand text-white" : "bg-white/8 text-ink-muted",
            )}
          >
            All groups
          </button>
          {WC2026_GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "pill tap transition",
                group === g ? "bg-brand text-white" : "bg-white/8 text-ink-muted",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-faint">No fixtures match this filter.</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {filtered.map((f) => (
            <FixtureCard key={f.id} fixture={f} />
          ))}
        </div>
      )}
    </div>
  );
}

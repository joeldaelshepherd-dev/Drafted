import { Countdown, StatPill } from "@/components/ui";
import type { MyTeamsSummary } from "@/lib/teams/types";

export function TeamSummaryBar({ summary }: { summary: MyTeamsSummary }) {
  const rivalry = summary.closestRivalry;
  const rivalGap = rivalry
    ? rivalry.gap === 0
      ? "Dead level"
      : rivalry.gap > 0
        ? `+${rivalry.gap} ahead`
        : `${rivalry.gap} behind`
    : "—";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <StatPill
        label="Total points"
        value={summary.totalPoints}
        sub={summary.projectedPoints > summary.totalPoints ? `${summary.projectedPoints} projected` : "Confirmed"}
        tone="brand"
      />
      <StatPill
        label="Active teams"
        value={summary.activeTeams}
        sub={summary.eliminatedTeams ? `${summary.eliminatedTeams} eliminated` : "All alive"}
      />
      <StatPill
        label="Next kickoff"
        value={
          summary.nextKickoffAt ? (
            <Countdown to={summary.nextKickoffAt} className="text-xl" />
          ) : (
            "—"
          )
        }
        sub={summary.nextKickoffTeam?.name ?? "No fixtures"}
        tone="live"
      />
      <StatPill
        label="Closest rival"
        value={rivalry ? rivalry.rival.name.split(" ")[0] : "—"}
        sub={rivalGap}
        tone="gold"
      />
      <StatPill
        label="Up for grabs"
        value={`+${summary.potentialPointsThisWeek}`}
        sub="This matchweek"
      />
      <StatPill
        label="Eliminated"
        value={summary.eliminatedTeams}
        sub="Points retained"
        tone={summary.eliminatedTeams ? "loss" : "default"}
      />
    </div>
  );
}

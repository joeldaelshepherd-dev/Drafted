import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card, Flag } from "@/components/ui";
import { getWorldCupTeam, flagUrlFor } from "@/lib/data/wc2026";
import { getTeamDashboard } from "@/lib/team/dashboard";
import { cn, ordinal } from "@/lib/utils";

export function generateMetadata({ params }: { params: { teamId: string } }): Metadata {
  const team = getWorldCupTeam(params.teamId);
  return {
    title: team ? `${team.name} — Supporter hub — Drafted` : "Team — Drafted",
  };
}

const TONE: Record<string, string> = {
  default: "text-ink",
  good: "text-brand",
  tough: "text-loss",
};

const MATCHDAY_LABEL: Record<number, string> = {
  1: "Matchday 1",
  2: "Matchday 2",
  3: "Matchday 3",
};

export default function TeamDashboardPage({ params }: { params: { teamId: string } }) {
  const view = getTeamDashboard(params.teamId);

  if (!view) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Team not found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            We couldn&apos;t match that team to the WC2026 field.
          </p>
        </div>
        <Link href="/">
          <Button variant="secondary" className="w-full justify-center">
            Back to dashboard
          </Button>
        </Link>
      </main>
    );
  }

  const { team, flagUrl, group, groupRows, position, isHostNation, fixtures } = view;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <Link href="/" className="text-xs font-bold text-ink-faint hover:text-brand">
        ← Back to dashboard
      </Link>

      {/* Header */}
      <header className="flex items-center gap-4">
        <Flag url={flagUrl} code={team.shortCode} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-3xl font-black text-ink">{team.name}</h1>
          <p className="text-xs text-ink-muted">
            Group {group} · {team.confederation} · FIFA #{team.fifaRanking}
          </p>
        </div>
        {isHostNation && (
          <span className="pill shrink-0 bg-brand/15 text-brand">Host</span>
        )}
      </header>

      {/* Projected route banner */}
      <Card glow className="flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          On current seeding
        </p>
        <p className="text-sm text-ink">{view.projectedRoute}</p>
      </Card>

      {/* Insights grid */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {view.insights.map((ins) => (
            <div key={ins.label} className="glass flex flex-col gap-1 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                {ins.label}
              </p>
              <p className={cn("text-sm font-black", TONE[ins.tone ?? "default"])}>
                {ins.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming fixtures */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Upcoming fixtures
        </h2>
        {fixtures.length === 0 ? (
          <p className="text-sm text-ink-faint">
            Fixtures appear once the schedule is confirmed.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {fixtures.map((f) => (
              <div key={f.id} className="glass flex items-center gap-3 p-3">
                <div className="flex w-16 shrink-0 flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                    {MATCHDAY_LABEL[f.matchday] ?? `MD ${f.matchday}`}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-bold",
                      f.isHome ? "text-brand" : "text-ink-muted",
                    )}
                  >
                    {f.isHome ? "Home" : "Away"}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-xs font-bold text-ink-faint">vs</span>
                  <Flag
                    url={f.opponent ? flagUrlFor(f.opponent) : null}
                    code={f.opponent?.shortCode}
                    size="sm"
                  />
                  <span className="truncate text-sm font-semibold text-ink">
                    {f.opponent?.name ?? "TBD"}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-ink-faint">{f.venue}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Group standings ("their pool") */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Group {group} standings
          </h2>
          <span className="text-xs font-bold text-brand">
            {ordinal(position)} place
          </span>
        </div>
        <Card className="flex flex-col gap-1 p-2">
          <div className="grid grid-cols-[1.5rem_1fr_2rem_2rem_2.25rem] gap-2 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            <span>#</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">GD</span>
            <span className="text-right">Pts</span>
          </div>
          {groupRows.map((row) => {
            const rowTeam = getWorldCupTeam(row.teamId);
            const isOwn = row.teamId === team.id;
            return (
              <div
                key={row.teamId}
                className={cn(
                  "grid grid-cols-[1.5rem_1fr_2rem_2rem_2.25rem] items-center gap-2 rounded-lg px-2 py-2 text-sm",
                  isOwn ? "bg-brand/10 font-black text-ink" : "text-ink-muted",
                )}
              >
                <span>{row.position}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <Flag
                    url={rowTeam ? flagUrlFor(rowTeam) : null}
                    code={rowTeam?.shortCode}
                    size="sm"
                  />
                  <span className="truncate">{rowTeam?.shortCode ?? row.teamId}</span>
                </span>
                <span className="text-right tabular-nums">{row.played}</span>
                <span className="text-right tabular-nums">{row.goalDifference}</span>
                <span className="text-right tabular-nums">{row.points}</span>
              </div>
            );
          })}
        </Card>
        <p className="text-[11px] text-ink-faint">
          Seeded order — updates live once matches kick off.
        </p>
      </section>

      {/* Supporter feed / talking points */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Supporter brief
        </h2>
        <Card className="flex flex-col gap-3">
          {view.talkingPoints.map((point, i) => (
            <div key={i} className="flex gap-2 text-sm text-ink-muted">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              <p>{point}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* Squad & news — honest placeholder */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Squad &amp; news
        </h2>
        <Card className="flex flex-col gap-2 text-sm text-ink-muted">
          <p className="font-semibold text-ink">Coming with the live data feed</p>
          <p>
            Squad lists, formations, key players and breaking news for {team.name} land
            once the football data provider is connected. For now this hub runs on the
            confirmed WC2026 draw and FIFA seeding.
          </p>
        </Card>
      </section>
    </main>
  );
}

import { cn } from "@/lib/utils";
import { Badge, Countdown, Flag, ProgressBar } from "@/components/ui";
import type { MyTeamCard as Card } from "@/lib/teams/types";

function ownershipTone(kind: string) {
  if (kind === "self") return "gold" as const;
  if (kind === "member") return "live" as const;
  return "neutral" as const;
}

export function MyTeamCard({ card }: { card: Card }) {
  const { team, record, eliminated, live, upcoming } = card;
  const proj = card.projectedPoints - card.points;

  return (
    <article
      className={cn(
        "glass relative flex w-[86vw] max-w-[360px] shrink-0 flex-col gap-3 p-4 snap-center sm:w-full",
        eliminated && "opacity-60 grayscale",
      )}
    >
      {/* Subtle cracked-glass overlay for eliminated teams */}
      {eliminated && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(115deg, transparent 46%, #fff 47%, transparent 48%), linear-gradient(200deg, transparent 60%, #fff 61%, transparent 62%)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Flag url={team.flagUrl} code={team.shortCode} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-bold text-ink">{team.name}</h3>
            <span title="Your team" aria-label="Your team" className="text-gold">
              ★
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
            {card.fifaRanking != null && <span>FIFA #{card.fifaRanking}</span>}
            {team.groupLabel && <span>Group {team.groupLabel}</span>}
          </div>
        </div>
        <Badge tone={eliminated ? "loss" : card.stage === "group" ? "neutral" : "brand"}>
          {eliminated ? "Eliminated" : card.progressionLabel}
        </Badge>
      </div>

      {/* Points + record */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-black tabular-nums text-ink">{card.points}</span>
            <span className="text-xs text-ink-muted">pts</span>
            {proj > 0 && (
              <span className="text-xs font-semibold text-brand tabular-nums">+{proj} proj</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold tabular-nums">
          <span className="text-win">{record.w}W</span>
          <span className="text-ink-muted">{record.d}D</span>
          <span className="text-loss">{record.l}L</span>
        </div>
      </div>

      {/* Qualification probability */}
      {!eliminated && card.qualificationProbability != null && (
        <ProgressBar
          value={card.qualificationProbability}
          tone={card.qualificationProbability >= 0.5 ? "brand" : "gold"}
          label="Qualification chance"
        />
      )}

      {/* Live block */}
      {live && (
        <div className="rounded-xl border border-live/30 bg-live/10 p-3">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-live">
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" /> Live · {live.fixture.minute}&rsquo;
            </span>
            <span>{card.team.shortCode} vs {live.opponent?.shortCode ?? "?"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="font-display text-2xl font-black tabular-nums text-ink animate-score-pop">
              {live.fixture.homeScore} – {live.fixture.awayScore}
            </span>
            <span className="text-xs font-bold text-brand">{live.caption}</span>
          </div>
        </div>
      )}

      {/* Upcoming block */}
      {upcoming && !eliminated && (
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted">Next</span>
              <Flag url={upcoming.opponent?.flagUrl} code={upcoming.opponent?.shortCode} size="sm" />
              <span className="text-sm font-semibold text-ink">
                {upcoming.opponent?.name ?? "TBD"}
              </span>
            </div>
            <Countdown to={upcoming.fixture.kickoffAt} className="text-sm" />
          </div>
          <div className="mt-2">
            <Badge tone={ownershipTone(upcoming.ownership.kind)}>{upcoming.ownership.label}</Badge>
          </div>
        </div>
      )}

      {/* Insight */}
      {card.insight && (
        <p className="text-[11px] italic text-ink-muted">{card.insight}</p>
      )}
    </article>
  );
}

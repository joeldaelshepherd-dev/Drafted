import { Flag } from "@/components/ui";
import { flagUrlFor } from "@/lib/data/wc2026";
import type { HubInsights } from "@/lib/hub/insights";

/**
 * Pre-tournament intelligence — all grounded in the real draw + FIFA ranking.
 * Leading scorers / upsets / live qualification scenarios arrive once matches
 * are played (see TODO in src/lib/hub/insights).
 */
export function TournamentInsights({ insights }: { insights: HubInsights }) {
  const { topSeeds, groupOfDeath, marquee, confederationCounts } = insights;

  return (
    <div className="space-y-3">
      <div className="glass space-y-3 p-4">
        <h3 className="font-display text-sm font-black uppercase tracking-wide text-ink">
          Top seeds
        </h3>
        <ol className="space-y-2">
          {topSeeds.map((team, i) => (
            <li key={team.id} className="flex items-center gap-3">
              <span className="font-display text-sm font-black tabular-nums text-ink-faint">
                {i + 1}
              </span>
              <Flag url={flagUrlFor(team)} code={team.shortCode} size="md" />
              <span className="flex-1 text-sm font-semibold text-ink">{team.name}</span>
              <span className="pill bg-brand/15 text-[11px] text-brand">#{team.fifaRanking}</span>
            </li>
          ))}
        </ol>
      </div>

      {groupOfDeath && (
        <div className="glass space-y-1 p-4">
          <h3 className="font-display text-sm font-black uppercase tracking-wide text-ink">
            Group of death
          </h3>
          <p className="text-sm text-ink-muted">
            <span className="font-bold text-ink">Group {groupOfDeath.group}</span> is the toughest
            on paper — average FIFA rank{" "}
            <span className="font-bold text-loss">{groupOfDeath.averageRank}</span>.
          </p>
        </div>
      )}

      {marquee && (
        <div className="glass space-y-2 p-4">
          <h3 className="font-display text-sm font-black uppercase tracking-wide text-ink">
            Marquee fixture
          </h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flag url={flagUrlFor(marquee.homeTeam)} code={marquee.homeTeam.shortCode} size="md" />
              <span className="text-sm font-semibold text-ink">{marquee.homeTeam.name}</span>
            </div>
            <span className="text-xs font-bold text-ink-faint">vs</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{marquee.awayTeam.name}</span>
              <Flag url={flagUrlFor(marquee.awayTeam)} code={marquee.awayTeam.shortCode} size="md" />
            </div>
          </div>
          <p className="text-[11px] text-ink-faint">
            Group {marquee.fixture.groupLabel} · MD{marquee.fixture.matchday} · {marquee.fixture.venue}
          </p>
        </div>
      )}

      <div className="glass space-y-3 p-4">
        <h3 className="font-display text-sm font-black uppercase tracking-wide text-ink">
          Confederation breakdown
        </h3>
        <div className="space-y-2">
          {confederationCounts.map(({ confederation, count }) => (
            <div key={confederation} className="flex items-center gap-3">
              <span className="w-20 text-xs font-bold text-ink-muted">{confederation}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(count / 48) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-xs font-black tabular-nums text-ink">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

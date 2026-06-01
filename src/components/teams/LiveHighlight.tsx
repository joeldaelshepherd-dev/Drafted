import { Flag } from "@/components/ui";
import type { LiveContext } from "@/lib/teams/types";

/** Hero banner for the user's most consequential live match. */
export function LiveHighlight({ live, teamName, teamFlag, teamCode }: {
  live: LiveContext;
  teamName: string;
  teamFlag: string | null;
  teamCode: string | null;
}) {
  const homeName = live.isHome ? teamCode : live.opponent?.shortCode;
  const awayName = live.isHome ? live.opponent?.shortCode : teamCode;

  return (
    <div className="glass relative overflow-hidden p-4 ring-1 ring-live/30">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-live/10 to-transparent" />
      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-live">
        <span className="inline-flex items-center gap-1.5">
          <span className="live-dot" /> Live · {live.fixture.minute}&rsquo;
        </span>
        <span className="text-ink-muted">Your match to watch</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="font-display text-sm font-bold text-ink">{homeName}</span>
          <Flag url={live.isHome ? teamFlag : live.opponent?.flagUrl} code={homeName} size="md" />
        </div>
        <span className="font-display text-4xl font-black tabular-nums text-ink animate-score-pop">
          {live.fixture.homeScore}–{live.fixture.awayScore}
        </span>
        <div className="flex flex-1 items-center gap-2">
          <Flag url={live.isHome ? live.opponent?.flagUrl : teamFlag} code={awayName} size="md" />
          <span className="font-display text-sm font-bold text-ink">{awayName}</span>
        </div>
      </div>

      <p className="mt-3 text-center text-sm font-bold text-brand">
        {teamName}: {live.caption}
      </p>
    </div>
  );
}

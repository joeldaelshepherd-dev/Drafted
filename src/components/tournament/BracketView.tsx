import { Flag } from "@/components/ui";
import { flagUrlFor, getWorldCupTeam } from "@/lib/data/wc2026";
import type { BracketMatch, BracketRound, BracketSlot } from "@/lib/hub/types";
import { cn } from "@/lib/utils";

/**
 * Horizontally-scrolling knockout bracket. Slots show the resolved team when
 * known, otherwise the projection label ("Winners A", "3rd Group C"). The whole
 * tree is a FIFA-seeding projection until real results land.
 */

function SlotRow({ slot, score }: { slot: BracketSlot; score: number | null }) {
  const team = slot.teamId ? getWorldCupTeam(slot.teamId) : undefined;
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <Flag url={team ? flagUrlFor(team) : null} code={team?.shortCode} size="sm" />
        <span className={cn("truncate text-xs font-semibold", team ? "text-ink" : "text-ink-faint")}>
          {team?.name ?? slot.label}
        </span>
      </div>
      <span className="font-display text-sm font-black tabular-nums text-ink-muted">
        {score ?? ""}
      </span>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  return (
    <div className="glass w-48 shrink-0 divide-y divide-white/5 p-0">
      <SlotRow slot={match.home} score={match.homeScore} />
      <SlotRow slot={match.away} score={match.awayScore} />
    </div>
  );
}

function RoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="flex shrink-0 flex-col gap-3">
      <h3 className="font-display text-xs font-black uppercase tracking-wide text-ink-muted">
        {round.label}
      </h3>
      <div className="flex flex-col justify-around gap-2.5 grow">
        {round.matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

export function BracketView({ rounds }: { rounds: BracketRound[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-gold/10 px-3 py-2 text-xs text-gold">
        <span className="font-bold">Projected</span>
        <span className="text-gold/80">
          Bracket is modelled from FIFA seeding and updates as real results come in.
        </span>
      </div>
      <div className="-mx-5 overflow-x-auto px-5 pb-2">
        <div className="flex gap-4">
          {rounds.map((round) => (
            <RoundColumn key={round.stage} round={round} />
          ))}
        </div>
      </div>
    </div>
  );
}

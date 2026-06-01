import { Button, Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";

/**
 * Draft "War Room": the best available teams by FIFA rank with quick draft /
 * queue actions, your current squad, and a count of remaining elite (top-10)
 * teams still on the board.
 */
export function WarRoom({
  availableTeams,
  mySquad,
  queuedIds,
  canDraft,
  onDraft,
  onToggleQueue,
  className,
}: {
  /** Available teams, expected pre-sorted by FIFA rank ascending. */
  availableTeams: WorldCupTeam[];
  mySquad: WorldCupTeam[];
  queuedIds: Set<string>;
  canDraft: boolean;
  onDraft: (teamId: string) => void;
  onToggleQueue: (teamId: string) => void;
  className?: string;
}) {
  const best = availableTeams.slice(0, 6);
  const eliteLeft = availableTeams.filter((t) => t.fifaRanking <= 10).length;

  return (
    <div className={cn("glass flex flex-col gap-4 rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          War Room
        </h3>
        <span className="rounded-lg bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          {eliteLeft} elite left
        </span>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          Best available
        </div>
        <ul className="flex flex-col gap-1.5">
          {best.map((t) => {
            const queued = queuedIds.has(t.id);
            return (
              <li key={t.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
                <span className="w-7 shrink-0 text-center font-display text-sm font-bold tabular-nums text-gold">
                  #{t.fifaRanking}
                </span>
                <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {t.name}
                </span>
                <button
                  onClick={() => onToggleQueue(t.id)}
                  aria-label={queued ? "Remove from queue" : "Add to queue"}
                  className={cn(
                    "tap grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold",
                    queued ? "bg-gold/20 text-gold" : "bg-white/8 text-ink-muted hover:text-ink",
                  )}
                >
                  {queued ? "★" : "☆"}
                </button>
                <Button
                  size="sm"
                  variant={canDraft ? "primary" : "secondary"}
                  disabled={!canDraft}
                  onClick={() => onDraft(t.id)}
                >
                  Draft
                </Button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
          Your squad ({mySquad.length})
        </div>
        {mySquad.length === 0 ? (
          <p className="rounded-xl bg-white/5 p-3 text-center text-sm text-ink-faint">
            No picks yet — your nations land here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {mySquad.map((t) => (
              <span
                key={t.id}
                className="flex items-center gap-1 rounded-md bg-white/8 py-0.5 pl-0.5 pr-1.5"
              >
                <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                <span className="text-[11px] font-semibold text-ink">{t.shortCode}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

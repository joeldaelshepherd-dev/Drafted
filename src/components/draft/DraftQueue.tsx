import { Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";

/**
 * Personal draft queue / watchlist. Reorder (up/down), remove, and a clear
 * marker on the team the auto-pick would take next. Teams already drafted by
 * someone else are dimmed and flagged as gone.
 */
export function DraftQueue({
  queue,
  teamsById,
  available,
  likelyAutoPickId,
  onReorder,
  onRemove,
  className,
}: {
  queue: string[];
  teamsById: Map<string, WorldCupTeam>;
  available: Set<string>;
  likelyAutoPickId: string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (teamId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("glass flex flex-col rounded-2xl p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Your Queue <span className="text-ink-faint">({queue.length})</span>
        </h3>
        {likelyAutoPickId && teamsById.get(likelyAutoPickId) && (
          <span className="rounded-lg bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
            Auto → {teamsById.get(likelyAutoPickId)!.shortCode}
          </span>
        )}
      </div>

      {queue.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">
          Star teams to queue them. If your clock runs out, we draft the top available one.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {queue.map((teamId, i) => {
            const t = teamsById.get(teamId);
            if (!t) return null;
            const gone = !available.has(teamId);
            const isAuto = teamId === likelyAutoPickId;
            return (
              <li
                key={teamId}
                className={cn(
                  "flex items-center gap-2 rounded-xl p-2",
                  isAuto ? "bg-gold/12 ring-1 ring-gold/40" : "bg-white/5",
                  gone && "opacity-40",
                )}
              >
                <span className="w-5 shrink-0 text-center font-display text-sm font-bold tabular-nums text-ink-faint">
                  {i + 1}
                </span>
                <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-faint">
                    #{t.fifaRanking} · {gone ? "Drafted" : isAuto ? "Next auto-pick" : "Available"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => onReorder(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="tap grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-ink-muted hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onReorder(i, i + 1)}
                    disabled={i === queue.length - 1}
                    aria-label="Move down"
                    className="tap grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-ink-muted hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemove(teamId)}
                    aria-label="Remove from queue"
                    className="tap grid h-7 w-7 place-items-center rounded-lg bg-white/8 text-ink-muted hover:text-loss"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

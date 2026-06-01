import { Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import type { DraftLogEntry, DraftLogKind } from "@/lib/draft/types";

const KIND_MARK: Record<DraftLogKind, string> = {
  draft_started: "🟢",
  pick: "🔥",
  auto_pick: "⏱",
  paused: "⏸",
  resumed: "▶",
  cancelled: "⛔",
  complete: "🏁",
};

/**
 * Persistent live announcement ticker. Newest event first, each pick carrying
 * the drafted nation's flag. Reads straight off the draft log.
 */
export function DraftTicker({
  log,
  teamsById,
  className,
  limit = 8,
}: {
  log: DraftLogEntry[];
  teamsById: Map<string, WorldCupTeam>;
  className?: string;
  limit?: number;
}) {
  const recent = log.slice(-limit).reverse();

  return (
    <div className={cn("glass rounded-2xl p-3", className)}>
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        <span className="live-dot" /> Live Feed
      </h3>
      {recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-faint">Picks will appear here as they happen.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recent.map((e, i) => {
            const t = e.teamId ? teamsById.get(e.teamId) : null;
            return (
              <li
                key={`${e.at}-${i}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  i === 0 ? "bg-brand/10 animate-fade-up" : "bg-white/3",
                )}
              >
                <span aria-hidden className="shrink-0 text-xs">
                  {KIND_MARK[e.kind]}
                </span>
                {t && (
                  <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                )}
                <span className="truncate text-ink-muted">{e.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

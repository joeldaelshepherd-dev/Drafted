"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import type { RankingSortKey } from "@/lib/fifa/types";

const SORTS: Array<{ key: RankingSortKey; label: string }> = [
  { key: "ranking", label: "Ranking" },
  { key: "alphabetical", label: "A–Z" },
  { key: "confederation", label: "Confed" },
  { key: "popularity", label: "Popular" },
];

function sortTeams(teams: WorldCupTeam[], key: RankingSortKey): WorldCupTeam[] {
  const a = teams.slice();
  switch (key) {
    case "alphabetical":
      return a.sort((x, y) => x.name.localeCompare(y.name));
    case "confederation":
      return a.sort(
        (x, y) => x.confederation.localeCompare(y.confederation) || x.fifaRanking - y.fifaRanking,
      );
    // "popularity" has no live signal offline → FIFA rank is the proxy, same as default.
    case "popularity":
    case "ranking":
    default:
      return a.sort((x, y) => x.fifaRanking - y.fifaRanking);
  }
}

/**
 * The board of teams still available, searchable + sortable. Drafted teams are
 * filtered out by the caller, so they simply disappear from the list.
 */
export function AvailableTeamsPanel({
  teams,
  queuedIds,
  canDraft,
  onDraft,
  onToggleQueue,
  className,
}: {
  teams: WorldCupTeam[];
  queuedIds: Set<string>;
  canDraft: boolean;
  onDraft: (teamId: string) => void;
  onToggleQueue: (teamId: string) => void;
  className?: string;
}) {
  const [sort, setSort] = useState<RankingSortKey>("ranking");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const filtered = q.trim()
      ? teams.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()))
      : teams;
    return sortTeams(filtered, sort);
  }, [teams, sort, q]);

  return (
    <div className={cn("glass flex flex-col rounded-2xl p-3", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Available <span className="text-ink-faint">({teams.length})</span>
        </h3>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search nations…"
        className="mb-2 h-10 w-full rounded-xl bg-white/5 px-3 text-sm text-ink placeholder:text-ink-faint outline-none ring-1 ring-white/10 focus:ring-brand/40"
      />

      <div className="mb-3 flex gap-1 no-scrollbar overflow-x-auto">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={cn(
              "tap shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold",
              sort === s.key ? "bg-brand/20 text-brand" : "bg-white/5 text-ink-muted hover:text-ink",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <ul className="flex max-h-[28rem] flex-col gap-1.5 overflow-y-auto no-scrollbar">
        {rows.map((t) => {
          const queued = queuedIds.has(t.id);
          return (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-2 pr-2.5"
            >
              <span className="w-7 shrink-0 text-center font-display text-sm font-bold tabular-nums text-ink-faint">
                {t.fifaRanking}
              </span>
              <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ink">{t.name}</div>
                <div className="text-[10px] uppercase tracking-wide text-ink-faint">
                  {t.confederation} · Grp {t.groupLabel}
                </div>
              </div>
              <button
                onClick={() => onToggleQueue(t.id)}
                aria-label={queued ? "Remove from queue" : "Add to queue"}
                className={cn(
                  "tap grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold",
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
        {rows.length === 0 && (
          <li className="py-8 text-center text-sm text-ink-faint">No teams match “{q}”.</li>
        )}
      </ul>
    </div>
  );
}

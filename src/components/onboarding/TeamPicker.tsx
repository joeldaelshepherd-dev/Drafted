"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Flag, Input } from "@/components/ui";
import { WC2026_TEAMS, flagUrlFor } from "@/lib/data/wc2026";

export function TeamPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const ranked = useMemo(
    () => [...WC2026_TEAMS].sort((a, b) => a.fifaRanking - b.fifaRanking),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((t) =>
      [t.name, t.shortCode, t.groupLabel, t.confederation]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [ranked, query]);

  const selectedTeams = useMemo(
    () => selected.map((id) => ranked.find((t) => t.id === id)).filter(Boolean),
    [ranked, selected],
  );

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search teams, groups, confederations…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {selectedTeams.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTeams.map(
            (t) =>
              t && (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="pill flex items-center gap-2 bg-brand/15 text-ink"
                >
                  <Flag url={flagUrlFor(t)} code={t.shortCode} size="sm" />
                  {t.name}
                  <span className="text-ink-faint">×</span>
                </button>
              ),
          )}
        </div>
      )}

      <div className="no-scrollbar flex max-h-[46vh] flex-col gap-1.5 overflow-y-auto">
        {results.map((t) => {
          const on = selected.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={cn(
                "tap flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                on
                  ? "border-brand/60 bg-brand/10"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
              )}
            >
              <Flag url={flagUrlFor(t)} code={t.shortCode} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{t.name}</p>
                <p className="truncate text-xs text-ink-faint">
                  Group {t.groupLabel} · {t.confederation} · FIFA #{t.fifaRanking}
                </p>
              </div>
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-black",
                  on ? "bg-brand text-bg" : "bg-white/10 text-ink-muted",
                )}
              >
                {on ? "✓" : "+"}
              </span>
            </button>
          );
        })}
        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-faint">No teams match “{query}”.</p>
        )}
      </div>
    </div>
  );
}

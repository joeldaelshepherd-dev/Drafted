"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MyTeamCard } from "./MyTeamCard";
import type { MyTeamCard as Card } from "@/lib/teams/types";

type Filter = "all" | "active" | "eliminated";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "eliminated", label: "Eliminated" },
];

export function MyTeamsBoard({ cards }: { cards: Card[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    const list =
      filter === "active"
        ? cards.filter((c) => !c.eliminated)
        : filter === "eliminated"
          ? cards.filter((c) => c.eliminated)
          : cards;
    // Eliminated teams sink to the bottom; then by projected points desc.
    return [...list].sort(
      (a, b) => Number(a.eliminated) - Number(b.eliminated) || b.projectedPoints - a.projectedPoints,
    );
  }, [cards, filter]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          My Teams
        </h2>
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                filter === f.key ? "bg-brand text-bg" : "text-ink-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="glass p-6 text-center text-sm text-ink-muted">No teams in this view.</p>
      ) : (
        <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
          {visible.map((card) => (
            <MyTeamCard key={card.team.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}

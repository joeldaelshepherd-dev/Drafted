"use client";

import { useState } from "react";
import type { TournamentHubData } from "@/lib/hub/demo";
import { cn } from "@/lib/utils";
import { BracketView } from "./BracketView";
import { FixturesView } from "./FixturesView";
import { GroupStandings } from "./GroupStandings";
import { TournamentInsights } from "./TournamentInsights";

type Tab = "fixtures" | "standings" | "bracket" | "insights";

const TABS: { id: Tab; label: string }[] = [
  { id: "fixtures", label: "Fixtures" },
  { id: "standings", label: "Standings" },
  { id: "bracket", label: "Bracket" },
  { id: "insights", label: "Insights" },
];

export function TournamentHub({ data }: { data: TournamentHubData }) {
  const [tab, setTab] = useState<Tab>("fixtures");

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-5 border-b border-white/5 bg-bg/80 px-5 py-2 backdrop-blur">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "tap flex-1 rounded-lg py-2 text-sm font-bold transition",
                tab === t.id ? "bg-brand text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "fixtures" && <FixturesView fixtures={data.fixtures} />}
      {tab === "standings" && <GroupStandings tables={data.tables} />}
      {tab === "bracket" && <BracketView rounds={data.bracket} />}
      {tab === "insights" && <TournamentInsights insights={data.insights} />}
    </div>
  );
}

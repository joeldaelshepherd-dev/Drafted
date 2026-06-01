import { Avatar, Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import type { DraftState } from "@/lib/draft/types";
import { currentDrafter, squadOf } from "@/lib/draft/engine";

/**
 * Real-time ownership board: every participant, their drafted teams in pick
 * order, and how many picks remain. The drafter on the clock is highlighted.
 */
export function DraftBoard({
  state,
  teamsById,
  currentUserId,
  className,
}: {
  state: DraftState;
  teamsById: Map<string, WorldCupTeam>;
  currentUserId?: string;
  className?: string;
}) {
  const onClock = currentDrafter(state);

  return (
    <div className={cn("glass rounded-2xl p-3", className)}>
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        Draft Board
      </h3>
      <ul className="flex flex-col gap-2">
        {state.participants.map((p) => {
          const squad = squadOf(state, p.userId);
          const remaining = state.rounds - squad.length;
          const live = p.userId === onClock;
          return (
            <li
              key={p.userId}
              className={cn(
                "rounded-xl p-2.5",
                live ? "bg-brand/12 ring-1 ring-brand/40" : "bg-white/5",
                p.userId === currentUserId && !live && "ring-1 ring-white/15",
              )}
            >
              <div className="flex items-center gap-2">
                <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-ink">
                      {p.name.split(" ")[0]}
                      {p.userId === currentUserId && (
                        <span className="ml-1 text-[10px] font-bold uppercase text-brand">you</span>
                      )}
                    </span>
                    {live && <span className="live-dot" />}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-faint">
                    {squad.length}/{state.rounds} · {remaining} left
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {squad.map((teamId) => {
                  const t = teamsById.get(teamId);
                  if (!t) return null;
                  return (
                    <span
                      key={teamId}
                      className="flex items-center gap-1 rounded-md bg-white/8 py-0.5 pl-0.5 pr-1.5 animate-pop-in"
                    >
                      <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                      <span className="text-[11px] font-semibold text-ink">{t.shortCode}</span>
                    </span>
                  );
                })}
                {Array.from({ length: Math.max(0, remaining) }).map((_, i) => (
                  <span
                    key={`empty-${i}`}
                    className="h-6 w-9 rounded-md border border-dashed border-white/10"
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

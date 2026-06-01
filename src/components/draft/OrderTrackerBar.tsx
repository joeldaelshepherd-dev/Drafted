import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DraftParticipant, DraftState } from "@/lib/draft/types";
import { orderTracker, upcomingPicks } from "@/lib/draft/engine";
import { roundDirection } from "@/lib/draft/order";

type Slot = { key: string; marker: string; label: string; userId: string | null };

/**
 * Always-visible draft order strip: PREVIOUS ✓ · CURRENT 🔥 · NEXT ⏭ · ON DECK,
 * plus the snake-direction arrow for the current round.
 */
export function OrderTrackerBar({
  state,
  className,
}: {
  state: DraftState;
  className?: string;
}) {
  const t = orderTracker(state);
  const byId = (id: string | null) =>
    id ? state.participants.find((p) => p.userId === id) ?? null : null;

  const slots: Array<{ heading: string; marker: string; p: DraftParticipant | null; live?: boolean }> = [
    { heading: "Previous", marker: "✓", p: byId(t.previous) },
    { heading: "On the clock", marker: "🔥", p: byId(t.current), live: true },
    { heading: "Next", marker: "⏭", p: byId(t.next) },
    { heading: "On deck", marker: "•", p: byId(t.onDeck) },
  ];

  const round = upcomingPicks(state, 1)[0]?.round ?? 0;
  const dir = roundDirection(round, state.settings.format);

  return (
    <div className={cn("glass flex items-center gap-2 overflow-x-auto rounded-2xl p-2 no-scrollbar", className)}>
      {state.settings.format === "snake" && (
        <span className="shrink-0 rounded-lg bg-white/8 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
          R{round + 1} {dir === "forward" ? "→" : "←"}
        </span>
      )}
      {slots.map((s, i) => (
        <div
          key={i}
          className={cn(
            "flex min-w-[112px] shrink-0 items-center gap-2 rounded-xl px-2.5 py-1.5",
            s.live ? "bg-brand/15 ring-1 ring-brand/40" : "bg-white/5",
          )}
        >
          {s.p ? (
            <Avatar name={s.p.name} src={s.p.avatarUrl} size="sm" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/8 text-ink-faint">—</span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-ink-faint">
              <span aria-hidden>{s.marker}</span>
              {s.heading}
            </div>
            <div className={cn("truncate text-xs font-semibold", s.live ? "text-brand" : "text-ink")}>
              {s.p ? s.p.name.split(" ")[0] : "—"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

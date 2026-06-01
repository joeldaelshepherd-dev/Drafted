import { Avatar, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DraftState } from "@/lib/draft/types";

function formatLabel(state: DraftState): string {
  const fmt = state.settings.format === "snake" ? "Snake" : "Standard";
  return `${fmt} · ${state.settings.pickSeconds}s clock · ${state.rounds} rounds`;
}

/**
 * Pre-draft lobby: who's in, the draft order, the rules of the night, and the
 * admin's "Start Draft" trigger. Mirrors the live-event feel before kickoff.
 */
export function DraftLobby({
  state,
  poolName,
  currentUserId,
  isAdmin,
  onStart,
  className,
}: {
  state: DraftState;
  poolName: string;
  currentUserId?: string;
  isAdmin: boolean;
  onStart: () => void;
  className?: string;
}) {
  const orderIds = state.order.slice(0, state.participants.length);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="glass relative overflow-hidden rounded-3xl p-6 text-center animate-fade-up">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(520px 200px at 50% 0%, rgb(var(--brand) / 0.18), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
            <span className="live-dot" /> Pre-Draft Lobby
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {poolName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{formatLabel(state)}</p>
          {isAdmin ? (
            <Button variant="primary" size="lg" className="mt-5 w-full sm:w-auto" onClick={onStart}>
              Start Draft
            </Button>
          ) : (
            <p className="mt-5 text-sm font-semibold text-ink-faint">
              Waiting for an admin to start the draft…
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass rounded-2xl p-3">
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
            Draft Order
          </h3>
          <ul className="flex flex-col gap-2">
            {orderIds.map((userId, i) => {
              const p = state.participants.find((x) => x.userId === userId);
              if (!p) return null;
              return (
                <li
                  key={userId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2",
                    userId === currentUserId ? "bg-brand/10 ring-1 ring-brand/30" : "bg-white/5",
                  )}
                >
                  <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold tabular-nums text-ink-faint">
                    {i + 1}
                  </span>
                  <Avatar name={p.name} src={p.avatarUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {p.name}
                    {userId === currentUserId && (
                      <span className="ml-1 text-[10px] font-bold uppercase text-brand">you</span>
                    )}
                  </span>
                  {p.isAdmin && (
                    <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold">
                      Admin
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass rounded-2xl p-3">
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
            Rules of the Night
          </h3>
          <dl className="flex flex-col gap-2 text-sm">
            <Rule label="Format" value={state.settings.format === "snake" ? "Snake (order reverses each round)" : "Standard (same order)"} />
            <Rule label="Pick clock" value={`${state.settings.pickSeconds} seconds`} />
            <Rule label="Squad size" value={`${state.rounds} teams each`} />
            <Rule label="Order" value={state.settings.orderMode === "random" ? "Randomised" : "Manual"} />
            <Rule label="Auto-pick" value={state.settings.autoPick ? "On (top queued/available)" : "Off"} />
            <Rule label="Announcements" value={state.settings.announcements ? "On" : "Off"} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-2.5 py-1.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

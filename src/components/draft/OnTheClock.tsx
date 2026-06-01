import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { DraftClock } from "@/lib/draft/useDraft";
import { DraftTimer } from "./DraftTimer";

/**
 * Impossible-to-miss "on the clock" hero. The active drafter's name fills the
 * banner with a glowing ring; the circular timer sits alongside.
 */
export function OnTheClock({
  name,
  avatarUrl,
  clock,
  isMe,
  round,
  totalRounds,
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  clock: DraftClock;
  isMe: boolean;
  round: number;
  totalRounds: number;
  className?: string;
}) {
  const firstName = name.split(" ")[0];
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-3xl p-5 ring-1 ring-brand/40 animate-glow-pulse",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(420px 180px at 20% 0%, rgb(var(--brand) / 0.18), transparent 70%)",
        }}
      />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
            <span className="live-dot" />
            On the clock
          </div>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={name} src={avatarUrl} size="lg" className="shrink-0 ring-2 ring-brand/50" />
            <div className="min-w-0">
              <div className="truncate font-display text-3xl font-extrabold leading-none text-ink sm:text-4xl">
                {isMe ? "You're up" : `${firstName} is up`}
              </div>
              <div className="mt-1 text-sm text-ink-muted">
                Round {round} of {totalRounds}
              </div>
            </div>
          </div>
        </div>
        <DraftTimer clock={clock} className="shrink-0" />
      </div>
    </div>
  );
}

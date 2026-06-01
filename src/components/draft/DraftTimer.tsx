import { cn } from "@/lib/utils";
import type { DraftClock } from "@/lib/draft/useDraft";

const TONE_STROKE: Record<DraftClock["tone"], string> = {
  normal: "rgb(var(--brand))",
  warning: "rgb(var(--gold))",
  critical: "rgb(var(--live))",
};

const TONE_TEXT: Record<DraftClock["tone"], string> = {
  normal: "text-ink",
  warning: "text-gold",
  critical: "text-live",
};

/**
 * Large circular pick countdown. Green → yellow under 20s → red under 10s,
 * and the whole dial pulses under 5s.
 */
export function DraftTimer({
  clock,
  size = 132,
  className,
}: {
  clock: DraftClock;
  size?: number;
  className?: string;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clock.fraction);
  const pulse = clock.secondsLeft <= 5 && clock.secondsLeft > 0;

  return (
    <div
      className={cn("relative grid place-items-center", pulse && "animate-clock-pulse", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE_STROKE[clock.tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 250ms linear, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={cn("font-display text-4xl font-extrabold tabular-nums", TONE_TEXT[clock.tone])}>
            {clock.secondsLeft}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint">sec</div>
        </div>
      </div>
    </div>
  );
}

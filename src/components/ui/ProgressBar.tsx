import { cn } from "@/lib/utils";

/** Slim progress/probability bar. `value` is 0–1. */
export function ProgressBar({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: "brand" | "gold" | "live" | "win" | "loss";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const fill = {
    brand: "bg-brand",
    gold: "bg-gold",
    live: "bg-live",
    win: "bg-win",
    loss: "bg-loss",
  }[tone];

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-[11px] text-ink-muted">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", fill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

/** Compact labelled metric used in summary widget rows. */
export function StatPill({
  label,
  value,
  sub,
  tone = "default",
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "brand" | "gold" | "live" | "win" | "loss";
  icon?: React.ReactNode;
  className?: string;
}) {
  const accent = {
    default: "text-ink",
    brand: "text-brand",
    gold: "text-gold",
    live: "text-live",
    win: "text-win",
    loss: "text-loss",
  }[tone];

  return (
    <div className={cn("glass flex flex-col gap-0.5 p-3", className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {icon}
        {label}
      </div>
      <div className={cn("font-display text-xl font-bold tabular-nums leading-none", accent)}>{value}</div>
      {sub && <div className="text-[11px] text-ink-muted">{sub}</div>}
    </div>
  );
}

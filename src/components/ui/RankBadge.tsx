import { cn, ordinal, rankDelta } from "@/lib/utils";

/** Rank pill with up/down movement chevron vs previous rank. */
export function RankBadge({
  rank,
  previous,
  className,
}: {
  rank: number;
  previous?: number | null;
  className?: string;
}) {
  const delta = rankDelta(rank, previous ?? null);
  const medal = rank === 1 ? "text-gold" : rank === 2 ? "text-ink" : rank === 3 ? "text-gold/60" : "text-ink-muted";

  return (
    <span className={cn("inline-flex items-center gap-1 font-display font-bold", className)}>
      <span className={cn("tabular-nums", medal)}>{ordinal(rank)}</span>
      {delta.dir !== "same" && (
        <span
          className={cn(
            "inline-flex items-center text-[10px] tabular-nums",
            delta.dir === "up" ? "text-win animate-rank-rise" : "text-loss",
          )}
        >
          {delta.dir === "up" ? "▲" : "▼"}
          {delta.amount}
        </span>
      )}
    </span>
  );
}

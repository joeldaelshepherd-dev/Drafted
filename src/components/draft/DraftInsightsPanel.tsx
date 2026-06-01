import { cn } from "@/lib/utils";

/**
 * Live commentary panel — ready-made insight lines (highest-ranked remaining,
 * biggest steal, most-drafted confederation) from projection.insightLines().
 */
export function DraftInsightsPanel({
  lines,
  className,
}: {
  lines: string[];
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-2xl p-3", className)}>
      <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        Draft Insights
      </h3>
      {lines.length === 0 ? (
        <p className="py-3 text-center text-sm text-ink-faint">
          Insights appear once the first picks are in.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-sm text-ink-muted"
            >
              <span aria-hidden className="mt-0.5 text-brand">›</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

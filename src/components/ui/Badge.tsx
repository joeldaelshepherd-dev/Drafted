import { cn } from "@/lib/utils";

const tones = {
  brand: "bg-brand/15 text-brand",
  gold: "bg-gold/15 text-gold",
  live: "bg-live/15 text-live",
  win: "bg-win/15 text-win",
  loss: "bg-loss/15 text-loss",
  neutral: "bg-white/8 text-ink-muted",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn("pill", tones[tone], className)} {...props} />;
}

/** Achievement badge chip with emoji glyph. */
const BADGE_GLYPHS: Record<string, string> = {
  oracle: "🔮",
  clutch: "🧊",
  chaos: "🎲",
  ice: "❄️",
  perfect_week: "💯",
  upset: "👑",
};

export function AchievementBadge({ code, label }: { code: string; label: string }) {
  return (
    <span className="pill bg-white/8 text-ink" title={label}>
      <span aria-hidden>{BADGE_GLYPHS[code] ?? "🏅"}</span>
      {label}
    </span>
  );
}

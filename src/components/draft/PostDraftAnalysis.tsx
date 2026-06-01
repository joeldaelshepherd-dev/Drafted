import { Avatar, Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import type { SquadBadge, SquadStrength } from "@/lib/draft/projection";

const GRADE_TONE: Array<{ prefix: string; cls: string }> = [
  { prefix: "A", cls: "text-brand" },
  { prefix: "B", cls: "text-gold" },
  { prefix: "C", cls: "text-ink-muted" },
];

function gradeClass(grade: string): string {
  return GRADE_TONE.find((g) => grade.startsWith(g.prefix))?.cls ?? "text-ink";
}

/**
 * Post-draft wrap: "DRAFT COMPLETE" hero, the projected-strength leaderboard
 * (ranked by squad rating, with grades + average FIFA rank), and fun badges.
 * Strictly non-scoring — this is "on paper" projection, not tournament points.
 */
export function PostDraftAnalysis({
  strengths,
  badges,
  teamsById,
  insightLines,
  currentUserId,
  className,
}: {
  strengths: SquadStrength[];
  badges: SquadBadge[];
  teamsById: Map<string, WorldCupTeam>;
  insightLines: string[];
  currentUserId?: string;
  className?: string;
}) {
  const nameOf = (userId: string) =>
    strengths.find((s) => s.userId === userId)?.name.split(" ")[0] ?? "—";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="glass relative overflow-hidden rounded-3xl p-6 text-center animate-fade-up">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(520px 200px at 50% 0%, rgb(var(--gold) / 0.18), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
            🏁 The Draft Is Done
          </div>
          <h2 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            Draft Complete
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Here&apos;s how the squads stack up on paper.
          </p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {badges.map((b) => (
            <div key={`${b.userId}-${b.label}`} className="glass rounded-2xl p-3 text-center">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gold">
                {b.label}
              </div>
              <div className="mt-1 font-display text-lg font-bold text-ink">{nameOf(b.userId)}</div>
              <div className="mt-0.5 text-[11px] text-ink-faint">{b.detail}</div>
            </div>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-3">
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
          Projected Strength Leaderboard
        </h3>
        <ul className="flex flex-col gap-2">
          {strengths.map((s, i) => (
            <li
              key={s.userId}
              className={cn(
                "rounded-xl p-2.5",
                s.userId === currentUserId ? "bg-brand/10 ring-1 ring-brand/30" : "bg-white/5",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold tabular-nums text-ink-faint">
                  {i + 1}
                </span>
                <Avatar name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">{s.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-ink-faint">
                    Avg rank {s.averageRank} · Rating {s.rating}
                  </div>
                </div>
                <span className={cn("font-display text-2xl font-extrabold", gradeClass(s.grade))}>
                  {s.grade}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                {s.teamIds.map((id) => {
                  const t = teamsById.get(id);
                  if (!t) return null;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-1 rounded-md bg-white/8 py-0.5 pl-0.5 pr-1.5"
                    >
                      <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                      <span className="text-[11px] font-semibold text-ink">{t.shortCode}</span>
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {insightLines.length > 0 && (
        <div className="glass rounded-2xl p-3">
          <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
            Headlines
          </h3>
          <ul className="flex flex-col gap-1.5">
            {insightLines.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-sm text-ink-muted"
              >
                <span aria-hidden className="mt-0.5 text-gold">★</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

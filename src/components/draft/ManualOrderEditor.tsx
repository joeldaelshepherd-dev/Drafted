"use client";

/**
 * Manual round-1 order editor — touch- and elderly-friendly, no drag-and-drop.
 *
 * Shows numbered pick slots (Pick 1, Pick 2, …), one manager per row, each with
 * large ▲/▼ buttons to nudge them up/down the order. Shuffle randomises, Reset
 * returns to join order. Below the list, the admin picks how rounds 2+ run
 * (snake / standard / random). Emits the ordered userId list via `onChange`.
 */
import { Button, Card } from "@/components/ui";
import type { SubsequentFormat } from "@/lib/draft/types";
import { cn, initials } from "@/lib/utils";

export interface OrderMember {
  id: string;
  name: string;
}

const SUBSEQUENT_OPTIONS: { value: SubsequentFormat; label: string; hint: string }[] = [
  { value: "snake", label: "Snake", hint: "Order reverses each round." },
  { value: "standard", label: "Standard", hint: "Same order every round." },
  { value: "random", label: "Random", hint: "Reshuffled each round." },
];

/**
 * Resolve the working order from the saved id list, tolerating drift: keep saved
 * ids that still map to a member, then append any members the saved list missed
 * (e.g. someone joined after the order was set), then drop unknown ids.
 */
function resolveOrder(members: OrderMember[], value: string[]): OrderMember[] {
  const byId = new Map(members.map((m) => [m.id, m]));
  const seen = new Set<string>();
  const ordered: OrderMember[] = [];
  for (const id of value) {
    const m = byId.get(id);
    if (m && !seen.has(id)) {
      ordered.push(m);
      seen.add(id);
    }
  }
  for (const m of members) {
    if (!seen.has(m.id)) ordered.push(m);
  }
  return ordered;
}

export function ManualOrderEditor({
  members,
  value,
  onChange,
  subsequentFormat,
  onSubsequentChange,
}: {
  members: OrderMember[];
  value: string[];
  onChange: (ids: string[]) => void;
  subsequentFormat: SubsequentFormat;
  onSubsequentChange: (f: SubsequentFormat) => void;
}) {
  const ordered = resolveOrder(members, value);

  const emit = (next: OrderMember[]) => onChange(next.map((m) => m.id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ordered.length) return;
    const next = ordered.slice();
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  const shuffle = () => {
    const next = ordered.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    emit(next);
  };

  const reset = () => emit(members);

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-1 p-2">
        {ordered.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-black text-brand">
              {i + 1}
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-black text-ink">
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{m.name}</span>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 justify-center p-0 text-lg"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${m.name} up`}
              >
                ▲
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 justify-center p-0 text-lg"
                onClick={() => move(i, 1)}
                disabled={i === ordered.length - 1}
                aria-label={`Move ${m.name} down`}
              >
                ▼
              </Button>
            </div>
          </div>
        ))}
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" className="w-full justify-center" onClick={shuffle}>
          Shuffle
        </Button>
        <Button variant="secondary" size="sm" className="w-full justify-center" onClick={reset}>
          Reset to join order
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">After round 1, use</p>
        <div className="grid grid-cols-3 gap-2">
          {SUBSEQUENT_OPTIONS.map((opt) => {
            const active = subsequentFormat === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSubsequentChange(opt.value)}
                className={cn(
                  "tap flex flex-col items-center gap-0.5 rounded-2xl border py-2 text-center transition-colors",
                  active
                    ? "border-brand bg-brand/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                )}
              >
                <span className="text-sm font-black text-ink">{opt.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-faint">
          This exact order is used for round 1. After that, picks follow your chosen pattern.
        </p>
      </div>
    </div>
  );
}

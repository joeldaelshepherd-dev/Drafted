"use client";

import { useEffect } from "react";
import { Button, Flag } from "@/components/ui";
import type { WorldCupTeam } from "@/lib/data/wc2026";

/**
 * "Are you sure you want to draft France?" confirmation. Renders a centered
 * glass dialog over a dimmed backdrop; Esc / backdrop click cancels.
 */
export function PickConfirmModal({
  team,
  onConfirm,
  onCancel,
}: {
  team: WorldCupTeam | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!team) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [team, onCancel, onConfirm]);

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="glass w-full max-w-sm rounded-3xl p-6 text-center animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex w-fit items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <Flag url={`https://flagcdn.com/${team.flagCode}.svg`} code={team.shortCode} size="lg" />
          <div className="text-left">
            <div className="font-display text-xl font-extrabold text-ink">{team.name}</div>
            <div className="text-[11px] uppercase tracking-wide text-ink-faint">
              #{team.fifaRanking} · {team.confederation}
            </div>
          </div>
        </div>
        <h3 className="font-display text-lg font-bold text-ink">
          Draft {team.name}?
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          This locks {team.name} onto your squad. You can&apos;t undo a pick.
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={onConfirm}>
            Confirm Pick
          </Button>
        </div>
      </div>
    </div>
  );
}

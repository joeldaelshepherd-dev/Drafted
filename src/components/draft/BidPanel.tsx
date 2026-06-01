"use client";

/**
 * BidPanel — the human bid mechanic for the auction / hybrid room.
 *
 * Shown to *every* manager while a nation is on the block. Surfaces who's
 * currently winning, three suggested bids (the minimum next bid plus one and two
 * raise-steps), and a custom-amount stepper — every option capped at what the
 * viewer can actually afford without breaking their squad reserve. A tap arms a
 * confirm/cancel sheet so no one fat-fingers a bid. When the viewer can't bid,
 * the panel explains why instead of vanishing.
 */
import { useEffect, useState } from "react";
import { Button, Flag } from "@/components/ui";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import { cn } from "@/lib/utils";

export function BidPanel({
  team,
  canIBid,
  nextBid,
  bidStep,
  myMaxBid,
  budget,
  isWinning,
  isRecycled,
  highBidderName,
  onBid,
}: {
  /** The nation on the block — drives the confirm sheet's flag/title. */
  team: WorldCupTeam | null;
  canIBid: boolean;
  /** Minimum legal next bid (opening floor, or current high + raise-step). */
  nextBid: number;
  /** One raise-step = 5% of the budget. */
  bidStep: number;
  /** Highest the viewer can bid without breaking their reserve. */
  myMaxBid: number;
  budget: number;
  /** The viewer is the current high bidder. */
  isWinning: boolean;
  /** This nation drew no bids last time and was re-offered. */
  isRecycled: boolean;
  /** Current leader's name, or null when no bid has landed yet. */
  highBidderName: string | null;
  onBid: (amount: number) => void;
}) {
  const [custom, setCustom] = useState(nextBid);
  const [pending, setPending] = useState<number | null>(null);

  // Keep the custom amount legal as bids land and the floor/ceiling move.
  useEffect(() => {
    setCustom((c) => Math.max(nextBid, Math.min(c, myMaxBid)));
  }, [nextBid, myMaxBid]);

  // Esc/Enter on the confirm sheet.
  useEffect(() => {
    if (pending == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPending(null);
      if (e.key === "Enter") {
        onBid(pending);
        setPending(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onBid]);

  const suggestions = Array.from(
    new Set([nextBid, nextBid + bidStep, nextBid + bidStep * 2]),
  ).filter((amt) => amt <= myMaxBid);

  const canCustom = custom >= nextBid && custom <= myMaxBid;

  const reason = isWinning
    ? "You're winning this lot — sit tight."
    : budget <= 0
      ? "No credits left to bid."
      : nextBid > myMaxBid
        ? "Bidding higher would break the reserve you need for a full squad."
        : "Bidding…";

  return (
    <div className="flex flex-col gap-3">
      {/* Winning banner */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl px-4 py-3",
          isWinning ? "bg-brand/15 ring-1 ring-brand/40" : "bg-white/5",
        )}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            {highBidderName ? "Winning" : "No bids yet"}
          </div>
          <div className="truncate font-display text-lg font-extrabold text-ink">
            {highBidderName ? `${highBidderName}${isWinning ? " (you)" : ""}` : `Opens at ${nextBid}`}
          </div>
        </div>
        {isRecycled && (
          <span className="pill shrink-0 bg-gold/15 text-gold">♻️ Back on the block</span>
        )}
      </div>

      {canIBid ? (
        <>
          {/* Suggested bids */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((amt, i) => (
              <Button
                key={amt}
                variant={i === 0 ? "primary" : "secondary"}
                size="lg"
                className="flex-1"
                onClick={() => setPending(amt)}
              >
                Bid {amt}
              </Button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/3 px-3 py-2">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                Custom bid
              </div>
              <div className="text-[11px] text-ink-faint">
                {nextBid}–{myMaxBid} credits
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 justify-center p-0 text-lg"
                onClick={() => setCustom((c) => Math.max(nextBid, c - bidStep))}
                disabled={custom <= nextBid}
                aria-label="Lower custom bid"
              >
                −
              </Button>
              <span className="w-12 text-center font-display text-2xl font-black tabular-nums text-gold">
                {custom}
              </span>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 justify-center p-0 text-lg"
                onClick={() => setCustom((c) => Math.min(myMaxBid, c + bidStep))}
                disabled={custom >= myMaxBid}
                aria-label="Raise custom bid"
              >
                +
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="justify-center"
                onClick={() => setPending(custom)}
                disabled={!canCustom}
              >
                Bid
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-white/5 px-3 py-2 text-center text-sm text-ink-faint">
          {reason}
        </p>
      )}

      {/* Confirm sheet */}
      {pending != null && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPending(null)}
        >
          <div
            className="glass w-full max-w-sm rounded-3xl p-6 text-center animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            {team && (
              <div className="mx-auto mb-4 flex w-fit items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <Flag
                  url={`https://flagcdn.com/${team.flagCode}.svg`}
                  code={team.shortCode}
                  size="lg"
                />
                <div className="text-left">
                  <div className="font-display text-xl font-extrabold text-ink">{team.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                    #{team.fifaRanking} · {team.confederation}
                  </div>
                </div>
              </div>
            )}
            <h3 className="font-display text-lg font-bold text-ink">
              Bid <span className="text-gold">{pending}</span> credits?
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              That leaves you <span className="font-bold text-ink">{budget - pending}</span> in the
              bank. If no one tops it, {team?.name ?? "this nation"} is yours.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setPending(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => {
                  onBid(pending);
                  setPending(null);
                }}
              >
                Place Bid
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Button, Flag } from "@/components/ui";
import { cn } from "@/lib/utils";
import { WC2026_TEAMS, getWorldCupTeam } from "@/lib/data/wc2026";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import { fifaRanking } from "@/lib/fifa";
import type { AuctionState, AuctionLogEntry, AuctionLogKind } from "@/lib/draft/auction";
import { ownedCount, squadOfAuction, toResultsDraftState } from "@/lib/draft/auction";
import { useAuction } from "@/lib/draft/useAuction";
import {
  draftInsights,
  insightLines,
  projectedStrengths,
  squadBadges,
} from "@/lib/draft/projection";
import { DraftTimer } from "./DraftTimer";
import { BidPanel } from "./BidPanel";
import { PostDraftAnalysis } from "./PostDraftAnalysis";

const TEAMS_BY_ID = new Map<string, WorldCupTeam>(WC2026_TEAMS.map((t) => [t.id, t]));
const ALL_TEAM_IDS = WC2026_TEAMS.map((t) => t.id);
const nameOf = (id: string) => getWorldCupTeam(id)?.name ?? id;

const KIND_MARK: Record<AuctionLogKind, string> = {
  auction_started: "🟢",
  nominate: "📣",
  bid: "💸",
  sold: "🔨",
  recycle: "♻️",
  fill: "🎁",
  paused: "⏸",
  resumed: "▶",
  cancelled: "⛔",
  complete: "🏁",
};

/**
 * Live auction / hybrid orchestrator. Wires the offline useAuction engine to the
 * room surfaces and routes by status: lobby → live/paused → complete/cancelled.
 * Production swap: replace useAuction's reducer dispatch with Supabase Realtime.
 */
export function AuctionRoom({
  initialState,
  currentUserId,
  poolName,
}: {
  initialState: AuctionState;
  currentUserId: string;
  poolName: string;
}) {
  const auction = useAuction({ initial: initialState, ranking: fifaRanking, nameOf, currentUserId });
  const {
    state,
    clock,
    isMyNomination,
    myBudget,
    myMaxBid,
    nextBid,
    bidStep,
    winningUserId,
    iAmWinning,
    canIBid,
    actions,
  } = auction;

  const [confirmCancel, setConfirmCancel] = useState(false);

  const isAdmin = useMemo(
    () => state.participants.find((p) => p.userId === currentUserId)?.isAdmin ?? false,
    [state.participants, currentUserId],
  );
  const nameFor = (userId: string) =>
    state.participants.find((p) => p.userId === userId)?.name ?? "A manager";

  const styleLabel = state.style === "hybrid" ? "Hybrid Auction" : "Auction";

  // ---- Lobby ----------------------------------------------------------------
  if (state.status === "lobby") {
    return (
      <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(540px 220px at 15% 0%, rgb(var(--brand) / 0.16), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
            {styleLabel} · {poolName}
          </div>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">The Auction Room</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            {state.style === "hybrid"
              ? `Bid for the ${state.lotPool.length} marquee nations — every manager's remaining slots are filled automatically once the big names are gone.`
              : "Nominate nations and bid your credits. Hold one credit in reserve for every slot you still need, so you never get priced out of a full squad."}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Managers" value={String(state.participants.length)} />
            <Stat label="Squad size" value={String(state.squadSize)} />
            <Stat label="Credits each" value={String(state.settings.budget)} />
            <Stat
              label={state.style === "hybrid" ? "On the block" : "Nations"}
              value={String(state.lotPool.length)}
            />
          </dl>

          <div className="mt-6">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Nomination order
            </div>
            <ol className="flex flex-wrap gap-2">
              {state.nominationOrder.map((uid, i) => (
                <li key={uid} className="pill bg-white/5 text-sm text-ink-muted">
                  <span className="mr-1 font-bold text-ink-faint">{i + 1}.</span>
                  {nameFor(uid)}
                </li>
              ))}
            </ol>
          </div>

          {isAdmin ? (
            <Button variant="primary" size="lg" className="mt-7 w-full" onClick={actions.start}>
              Start the Auction
            </Button>
          ) : (
            <p className="mt-7 text-center text-sm text-ink-faint">
              Waiting for an admin to start the auction.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ---- Complete -------------------------------------------------------------
  if (state.status === "complete") {
    const results = toResultsDraftState(state);
    const strengths = projectedStrengths(results, fifaRanking);
    const ownedIds = new Set(state.wins.map((w) => w.teamId));
    const available = ALL_TEAM_IDS.filter((id) => !ownedIds.has(id));
    const lines = insightLines(draftInsights(results, fifaRanking, TEAMS_BY_ID, available));
    return (
      <div className="flex flex-col gap-4">
        <SpendSummary state={state} nameFor={nameFor} currentUserId={currentUserId} />
        <PostDraftAnalysis
          strengths={strengths}
          badges={squadBadges(strengths, fifaRanking)}
          teamsById={TEAMS_BY_ID}
          insightLines={lines}
          currentUserId={currentUserId}
        />
      </div>
    );
  }

  // ---- Cancelled ------------------------------------------------------------
  if (state.status === "cancelled") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-loss">
          Auction Cancelled
        </div>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">All lots were cleared</h2>
        <p className="mt-1 text-sm text-ink-muted">
          An admin cancelled this auction. Bids and history have been wiped.
        </p>
      </div>
    );
  }

  // ---- Live / Paused --------------------------------------------------------
  const lot = state.current;
  const lotTeam = lot ? TEAMS_BY_ID.get(lot.teamId) : null;
  const nomTeams = state.lotPool
    .map((id) => TEAMS_BY_ID.get(id))
    .filter((t): t is WorldCupTeam => !!t)
    .slice(0, 12);

  const lotRecycled = !!lot && state.recycled.includes(lot.teamId);

  return (
    <div className="relative flex flex-col gap-4">
      {/* Headline */}
      <div className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
          <span className="live-dot" /> {styleLabel} live
        </div>
        <div className="text-sm text-ink-muted">
          Your credits: <span className="font-bold text-gold">{myBudget}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* On the block */}
        <div className="flex flex-col gap-4">
          <div className="glass relative overflow-hidden rounded-3xl p-5 ring-1 ring-brand/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                  {lot ? "On the block" : "Awaiting nomination"}
                </div>
                {lotTeam ? (
                  <>
                    <div className="mt-2 flex items-center gap-3">
                      <Flag
                        url={`https://flagcdn.com/${lotTeam.flagCode}.svg`}
                        code={lotTeam.shortCode}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-display text-3xl font-extrabold leading-none text-ink">
                          {lotTeam.name}
                        </div>
                        <div className="mt-1 text-sm text-ink-muted">
                          FIFA #{lotTeam.fifaRanking} · nominated by {nameFor(lot!.nominatedBy)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-black text-gold">{lot!.highBid}</span>
                      <span className="text-sm text-ink-muted">
                        high bid · {nameFor(lot!.highBidder)}
                        {lot!.highBidder === currentUserId ? " (you)" : ""}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="mt-2">
                    <div className="font-display text-2xl font-extrabold text-ink">
                      {isMyNomination ? "You nominate" : `${nameFor(auction.onNomination ?? "")} nominates`}
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {isMyNomination
                        ? "Pick a nation to put up for bidding."
                        : "Hang tight — the next nation is about to go up."}
                    </div>
                  </div>
                )}
              </div>
              <DraftTimer clock={clock} size={108} className="shrink-0" />
            </div>

            {/* Bid controls */}
            {lot && (
              <div className="mt-5">
                <BidPanel
                  team={lotTeam}
                  canIBid={canIBid}
                  nextBid={nextBid}
                  bidStep={bidStep}
                  myMaxBid={myMaxBid}
                  budget={myBudget}
                  isWinning={iAmWinning}
                  isRecycled={lotRecycled}
                  highBidderName={winningUserId ? nameFor(winningUserId) : null}
                  onBid={(amt) => actions.bid(amt)}
                />
              </div>
            )}

            {/* Nomination picker */}
            {!lot && isMyNomination && (
              <div className="mt-5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Tap a nation to nominate
                </div>
                <div className="flex flex-wrap gap-2">
                  {nomTeams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="tap flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-sm text-ink ring-1 ring-white/10 hover:bg-brand/15 hover:ring-brand/40"
                      onClick={() => actions.nominateTeam(t.id)}
                    >
                      <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-ink-faint">#{t.fifaRanking}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Budget board */}
          <div className="glass rounded-2xl p-4">
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
              Managers
            </h3>
            <ul className="flex flex-col gap-1.5">
              {state.participants.map((p) => {
                const owned = ownedCount(state, p.userId);
                const leading = lot?.highBidder === p.userId;
                const isNom = !lot && auction.onNomination === p.userId;
                return (
                  <li
                    key={p.userId}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                      p.userId === currentUserId ? "bg-brand/10" : "bg-white/3",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate text-ink">
                      {leading && <span aria-hidden>🔨</span>}
                      {isNom && <span aria-hidden>📣</span>}
                      <span className="truncate font-semibold">
                        {p.name}
                        {p.userId === currentUserId ? " (you)" : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-xs">
                      <span className="text-ink-faint">
                        {owned}/{state.squadSize}
                      </span>
                      <span className="font-bold text-gold tabular-nums">
                        {state.budgets[p.userId] ?? 0}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4">
          {isAdmin && (
            <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
              <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                Admin
              </span>
              {state.status === "live" ? (
                <Button variant="secondary" size="sm" onClick={actions.pause}>
                  Pause
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={actions.resume}>
                  Resume
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
                Cancel
              </Button>
            </div>
          )}

          <AuctionTicker log={state.log} teamsById={TEAMS_BY_ID} />

          <MySquad
            teamIds={squadOfAuction(state, currentUserId)}
            squadSize={state.squadSize}
            wins={state.wins}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Pause overlay */}
      {state.status === "paused" && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-sm rounded-3xl p-8 text-center animate-pop-in">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
              ⏸ Auction Paused
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">The clock is frozen</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isAdmin ? "Resume when everyone's ready." : "Waiting for an admin to resume."}
            </p>
            {isAdmin && (
              <Button variant="primary" size="lg" className="mt-5 w-full" onClick={actions.resume}>
                Resume Auction
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Cancel confirmation */}
      {confirmCancel && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setConfirmCancel(false)}
        >
          <div
            className="glass w-full max-w-sm rounded-3xl p-6 text-center animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-loss">
              Cancel Auction
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink">
              Permanently delete every bid and result?
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              This wipes the auction and returns the pool to a clean slate. It can&apos;t be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmCancel(false)}
              >
                Keep Bidding
              </Button>
              <Button
                variant="danger"
                size="lg"
                className="flex-1"
                onClick={() => {
                  actions.cancel();
                  setConfirmCancel(false);
                }}
              >
                Cancel Auction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3 text-center">
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}

function AuctionTicker({
  log,
  teamsById,
  limit = 9,
}: {
  log: AuctionLogEntry[];
  teamsById: Map<string, WorldCupTeam>;
  limit?: number;
}) {
  const recent = log.slice(-limit).reverse();
  return (
    <div className="glass rounded-2xl p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        <span className="live-dot" /> Live Feed
      </h3>
      {recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-faint">Bids will appear here as they land.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recent.map((e, i) => {
            const t = e.teamId ? teamsById.get(e.teamId) : null;
            return (
              <li
                key={`${e.at}-${i}`}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                  i === 0 ? "bg-brand/10 animate-fade-up" : "bg-white/3",
                )}
              >
                <span aria-hidden className="shrink-0 text-xs">
                  {KIND_MARK[e.kind]}
                </span>
                {t && (
                  <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                )}
                <span className="truncate text-ink-muted">{e.message}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MySquad({
  teamIds,
  squadSize,
  wins,
  currentUserId,
}: {
  teamIds: string[];
  squadSize: number;
  wins: AuctionState["wins"];
  currentUserId: string;
}) {
  const priceOf = (teamId: string) =>
    wins.find((w) => w.teamId === teamId && w.userId === currentUserId);
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        Your squad · {teamIds.length}/{squadSize}
      </h3>
      {teamIds.length === 0 ? (
        <p className="py-3 text-center text-sm text-ink-faint">
          Win a lot and your nations land here.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {teamIds.map((id) => {
            const t = TEAMS_BY_ID.get(id);
            const win = priceOf(id);
            if (!t) return null;
            return (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-white/3 px-2.5 py-1.5 text-sm">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <Flag url={`https://flagcdn.com/${t.flagCode}.svg`} code={t.shortCode} size="sm" />
                  <span className="truncate font-semibold text-ink">{t.name}</span>
                </span>
                <span className="shrink-0 text-xs font-bold text-gold">
                  {win?.auto ? "free" : win ? `${win.price} cr` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SpendSummary({
  state,
  nameFor,
  currentUserId,
}: {
  state: AuctionState;
  nameFor: (userId: string) => string;
  currentUserId: string;
}) {
  const rows = state.participants.map((p) => {
    const spent = state.wins
      .filter((w) => w.userId === p.userId)
      .reduce((acc, w) => acc + w.price, 0);
    return { userId: p.userId, name: nameFor(p.userId), spent, left: state.budgets[p.userId] ?? 0 };
  });
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-ink-muted">
        Final spend
      </h3>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {rows.map((r) => (
          <li
            key={r.userId}
            className={cn(
              "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm",
              r.userId === currentUserId ? "bg-brand/10" : "bg-white/3",
            )}
          >
            <span className="truncate font-semibold text-ink">
              {r.name}
              {r.userId === currentUserId ? " (you)" : ""}
            </span>
            <span className="shrink-0 text-xs text-ink-muted">
              spent <span className="font-bold text-gold">{r.spent}</span> · {r.left} left
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

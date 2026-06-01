"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { WC2026_TEAMS, getWorldCupTeam } from "@/lib/data/wc2026";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import { fifaRanking } from "@/lib/fifa";
import type { DraftState } from "@/lib/draft/types";
import { useDraft } from "@/lib/draft/useDraft";
import { squadOf, upcomingPicks } from "@/lib/draft/engine";
import {
  draftInsights,
  insightLines,
  projectedStrengths,
  squadBadges,
} from "@/lib/draft/projection";
import { DraftLobby } from "./DraftLobby";
import { OnTheClock } from "./OnTheClock";
import { OrderTrackerBar } from "./OrderTrackerBar";
import { AvailableTeamsPanel } from "./AvailableTeamsPanel";
import { DraftQueue } from "./DraftQueue";
import { DraftBoard } from "./DraftBoard";
import { DraftTicker } from "./DraftTicker";
import { DraftInsightsPanel } from "./DraftInsightsPanel";
import { WarRoom } from "./WarRoom";
import { PickConfirmModal } from "./PickConfirmModal";
import { PostDraftAnalysis } from "./PostDraftAnalysis";

const TEAMS_BY_ID = new Map<string, WorldCupTeam>(WC2026_TEAMS.map((t) => [t.id, t]));
const ALL_TEAM_IDS = WC2026_TEAMS.map((t) => t.id);
const nameOf = (id: string) => getWorldCupTeam(id)?.name ?? id;

/**
 * Live draft orchestrator. Wires the offline useDraft engine to every surface
 * and routes the UI by draft status: lobby → live/paused → complete/cancelled.
 * Production swap: replace useDraft's reducer dispatch with Supabase Realtime.
 */
export function DraftRoom({
  initialState,
  currentUserId,
  poolName,
}: {
  initialState: DraftState;
  currentUserId: string;
  poolName: string;
}) {
  const draft = useDraft({
    initial: initialState,
    ranking: fifaRanking,
    allTeamIds: ALL_TEAM_IDS,
    nameOf,
    currentUserId,
  });
  const { state, clock, available, isMyTurn, actions } = draft;

  const [pending, setPending] = useState<WorldCupTeam | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isAdmin = useMemo(
    () => state.participants.find((p) => p.userId === currentUserId)?.isAdmin ?? false,
    [state.participants, currentUserId],
  );

  const availableTeams = useMemo(
    () => available.map((id) => TEAMS_BY_ID.get(id)).filter((t): t is WorldCupTeam => !!t),
    [available],
  );
  const availableByRank = useMemo(
    () => [...availableTeams].sort((a, b) => a.fifaRanking - b.fifaRanking),
    [availableTeams],
  );
  const queuedIds = useMemo(() => new Set(draft.myQueue), [draft.myQueue]);
  const mySquad = useMemo(
    () => squadOf(state, currentUserId).map((id) => TEAMS_BY_ID.get(id)).filter((t): t is WorldCupTeam => !!t),
    [state, currentUserId],
  );

  const lines = useMemo(
    () => insightLines(draftInsights(state, fifaRanking, TEAMS_BY_ID, available)),
    [state, available],
  );

  const onClockId = draft.onTheClock;
  const onClockParticipant = state.participants.find((p) => p.userId === onClockId);
  const round = upcomingPicks(state, 1)[0]?.round ?? 0;

  // ---- Lobby ----------------------------------------------------------------
  if (state.status === "lobby") {
    return (
      <DraftLobby
        state={state}
        poolName={poolName}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onStart={actions.start}
      />
    );
  }

  // ---- Complete -------------------------------------------------------------
  if (state.status === "complete") {
    const strengths = projectedStrengths(state, fifaRanking);
    return (
      <PostDraftAnalysis
        strengths={strengths}
        badges={squadBadges(strengths, fifaRanking)}
        teamsById={TEAMS_BY_ID}
        insightLines={lines}
        currentUserId={currentUserId}
      />
    );
  }

  // ---- Cancelled ------------------------------------------------------------
  if (state.status === "cancelled") {
    return (
      <div className="glass rounded-3xl p-8 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-loss">
          Draft Cancelled
        </div>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">
          All picks were cleared
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          An admin cancelled this draft. Selections and history have been wiped.
        </p>
      </div>
    );
  }

  // ---- Live / Paused --------------------------------------------------------
  const canDraft = isMyTurn && state.status === "live";

  const requestPick = (teamId: string) => {
    const t = TEAMS_BY_ID.get(teamId);
    if (t) setPending(t);
  };
  const confirmPick = () => {
    if (pending) actions.pick(pending.id);
    setPending(null);
  };

  return (
    <div className="relative flex flex-col gap-4">
      <OrderTrackerBar state={state} />

      {onClockParticipant && (
        <OnTheClock
          name={onClockParticipant.name}
          avatarUrl={onClockParticipant.avatarUrl}
          clock={clock}
          isMe={isMyTurn}
          round={round + 1}
          totalRounds={state.rounds}
        />
      )}

      {isAdmin && (
        <div className="glass flex flex-wrap items-center gap-2 rounded-2xl p-2">
          <span className="px-1 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Admin
          </span>
          {state.status === "live" ? (
            <Button variant="secondary" size="sm" onClick={actions.pause}>
              Pause Draft
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={actions.resume}>
              Resume Draft
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
            Cancel Draft
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-4">
          <AvailableTeamsPanel
            teams={availableTeams}
            queuedIds={queuedIds}
            canDraft={canDraft}
            onDraft={requestPick}
            onToggleQueue={(id) => (queuedIds.has(id) ? actions.dequeue(id) : actions.enqueue(id))}
          />
          <WarRoom
            availableTeams={availableByRank}
            mySquad={mySquad}
            queuedIds={queuedIds}
            canDraft={canDraft}
            onDraft={requestPick}
            onToggleQueue={(id) => (queuedIds.has(id) ? actions.dequeue(id) : actions.enqueue(id))}
          />
        </div>

        <div className="flex flex-col gap-4">
          <DraftQueue
            queue={draft.myQueue}
            teamsById={TEAMS_BY_ID}
            available={new Set(available)}
            likelyAutoPickId={draft.myLikelyAutoPick}
            onReorder={actions.reorderQueue}
            onRemove={actions.dequeue}
          />
          <DraftTicker log={state.log} teamsById={TEAMS_BY_ID} />
          <DraftInsightsPanel lines={lines} />
          <DraftBoard state={state} teamsById={TEAMS_BY_ID} currentUserId={currentUserId} />
        </div>
      </div>

      {/* Pause overlay */}
      {state.status === "paused" && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass max-w-sm rounded-3xl p-8 text-center animate-pop-in">
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-gold">
              ⏸ Draft Paused
            </div>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">
              The clock is frozen
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              {isAdmin ? "Resume when everyone's ready." : "Waiting for an admin to resume."}
            </p>
            {isAdmin && (
              <Button variant="primary" size="lg" className="mt-5 w-full" onClick={actions.resume}>
                Resume Draft
              </Button>
            )}
          </div>
        </div>
      )}

      <PickConfirmModal team={pending} onConfirm={confirmPick} onCancel={() => setPending(null)} />

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
              Cancel Draft
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink">
              Permanently delete all draft selections and history?
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              This wipes every pick and returns the pool to a clean slate. It can&apos;t be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmCancel(false)}
              >
                Keep Drafting
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
                Cancel Draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

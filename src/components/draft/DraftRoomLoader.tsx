"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { usePools } from "@/lib/pools/store";
import { useProfile } from "@/lib/profile/store";
import { useDraftConfig, DEFAULT_DRAFT_SETTINGS } from "@/lib/draft/config-store";
import { createDraft } from "@/lib/draft/lifecycle";
import { createAuction } from "@/lib/draft/auction";
import { DEMO_DRAFT_USER } from "@/lib/draft/demo";
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import { fifaRanking } from "@/lib/fifa";
import type { DraftParticipant, DraftState } from "@/lib/draft/types";
import type { AuctionState } from "@/lib/draft/auction";
import { DraftRoom } from "./DraftRoom";
import { AuctionRoom } from "./AuctionRoom";

type RoomState =
  | { mode: "draft"; state: DraftState }
  | { mode: "auction"; state: AuctionState };

/**
 * Builds the live room from the real pool roster + the admin's saved settings
 * (falling back to defaults if it was never set up), then routes by style:
 * "draft" → DraftRoom, "auction"/"hybrid" → AuctionRoom. Production swap:
 * replace this localStorage hydration with a Supabase read + Realtime sub.
 */
export function DraftRoomLoader({ poolId }: { poolId: string }) {
  const { pools, loading: poolsLoading } = usePools();
  const { profile, loading: profileLoading } = useProfile();
  const { settings, loading: configLoading } = useDraftConfig(poolId);

  const pool = pools.find((p) => p.id === poolId);
  const loading = poolsLoading || profileLoading || configLoading;

  const room = useMemo<RoomState | null>(() => {
    if (loading || !pool) return null;
    const cfg = settings ?? DEFAULT_DRAFT_SETTINGS;
    const participants: DraftParticipant[] = pool.members.map((m) => ({
      userId: m.id,
      name: m.name,
      isAdmin: m.id === pool.adminId,
    }));
    if (cfg.style === "auction" || cfg.style === "hybrid") {
      const allTeamIds = WC2026_TEAMS.map((t) => t.id);
      return {
        mode: "auction",
        state: createAuction({
          settings: cfg,
          participants,
          poolTeamCount: WC2026_TEAMS.length,
          allTeamIds,
          ranking: fifaRanking,
        }),
      };
    }
    return {
      mode: "draft",
      state: createDraft({
        settings: cfg,
        participants,
        poolTeamCount: WC2026_TEAMS.length,
      }),
    };
  }, [loading, pool, settings]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
        <div className="skeleton h-8 w-56 rounded-xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </main>
    );
  }

  if (!pool || !room) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Pool not found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This pool isn&apos;t on your device, so there&apos;s no draft to open.
          </p>
        </div>
        <Link href="/">
          <Button className="w-full justify-center">Back to dashboard</Button>
        </Link>
      </main>
    );
  }

  const currentUserId = profile?.id ?? DEMO_DRAFT_USER;

  const subline =
    room.mode === "auction"
      ? room.state.style === "hybrid"
        ? "Hybrid auction · bid for the marquee nations, the rest fill automatically."
        : "Auction · nominate nations and bid your credits to build a squad."
      : `${room.state.settings.format === "snake" ? "Snake draft" : "Standard draft"} · pick your nations, work your queue, and watch the board fill up.`;

  const heading =
    room.mode === "auction"
      ? room.state.style === "hybrid"
        ? "The Hybrid Auction"
        : "The Auction"
      : "The Draft";

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-6 pb-24">
      <header className="space-y-1">
        <Link
          href={`/pools/${pool.id}`}
          className="text-xs font-semibold text-ink-muted hover:text-ink"
        >
          ← {pool.name}
        </Link>
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">{heading}</h1>
        <p className="text-sm text-ink-muted">{subline}</p>
      </header>

      {room.mode === "auction" ? (
        <AuctionRoom initialState={room.state} currentUserId={currentUserId} poolName={pool.name} />
      ) : (
        <DraftRoom initialState={room.state} currentUserId={currentUserId} poolName={pool.name} />
      )}
    </main>
  );
}

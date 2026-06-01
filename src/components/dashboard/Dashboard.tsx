"use client";

import Link from "next/link";
import { Button, Card, Flag } from "@/components/ui";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { UpcomingFixtures } from "./UpcomingFixtures";
import { usePools } from "@/lib/pools/store";
import { getWorldCupTeam, flagUrlFor } from "@/lib/data/wc2026";
import type { WorldCupTeam } from "@/lib/data/wc2026";
import type { PlayerProfile } from "@/lib/profile/types";
import type { DraftStatus, Pool } from "@/lib/pools/types";
import { cn } from "@/lib/utils";

const DRAFT_BADGE: Record<DraftStatus, { label: string; className: string }> = {
  not_started: { label: "Draft to come", className: "bg-gold/15 text-gold" },
  in_progress: { label: "Draft live", className: "bg-loss/20 text-loss" },
  complete: { label: "Drafted", className: "bg-brand/15 text-brand" },
};

function PoolCard({ pool }: { pool: Pool }) {
  const badge = DRAFT_BADGE[pool.draftStatus];
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black text-ink">{pool.name}</p>
          <p className="text-xs text-ink-muted">
            {pool.tournamentName} · {pool.members.length}{" "}
            {pool.members.length === 1 ? "manager" : "managers"}
            {pool.isAdmin ? " · You're admin" : ""}
          </p>
        </div>
        <span className={cn("pill shrink-0", badge.className)}>{badge.label}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Link href={`/pools/${pool.id}/draft`}>
          <Button variant="secondary" size="sm" className="w-full justify-center">
            Draft
          </Button>
        </Link>
        <Link href={`/pools/${pool.id}/my-teams`}>
          <Button variant="secondary" size="sm" className="w-full justify-center">
            My teams
          </Button>
        </Link>
        <Link href={`/pools/${pool.id}/tournament`}>
          <Button variant="secondary" size="sm" className="w-full justify-center">
            Hub
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function Dashboard({
  profile,
  onSignOut,
}: {
  profile: PlayerProfile;
  onSignOut: () => void;
}) {
  const { pools, loading } = usePools();

  const teams = profile.supportedTeamIds
    .map((id) => getWorldCupTeam(id))
    .filter((t): t is WorldCupTeam => Boolean(t));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <header className="flex items-center gap-3">
        <ProfileAvatar config={profile.avatar} name={`${profile.firstName} ${profile.lastName}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Welcome back</p>
          <p className="truncate text-lg font-black text-ink">{profile.nickname}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-xs font-bold text-ink-faint hover:text-loss"
        >
          Sign out
        </button>
      </header>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/pools/new">
          <Button size="lg" className="w-full justify-center">
            Create a pool
          </Button>
        </Link>
        <Link href="/pools/join">
          <Button size="lg" variant="secondary" className="w-full justify-center">
            Join a pool
          </Button>
        </Link>
      </div>

      {/* My Pools */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">My pools</h2>
        {loading ? (
          <>
            <div className="skeleton h-24 w-full rounded-2xl" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </>
        ) : pools.length === 0 ? (
          <Card className="flex flex-col gap-3 text-sm text-ink-muted">
            <p>You&apos;re not in any pools yet. Create one and invite your crew, or join with a code.</p>
          </Card>
        ) : (
          pools.map((p) => <PoolCard key={p.id} pool={p} />)
        )}
      </section>

      {/* Upcoming fixtures */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Upcoming fixtures
          </h2>
          <Link
            href={`/pools/${pools[0]?.id ?? ""}/tournament`}
            className={cn(
              "text-xs font-bold text-brand hover:underline",
              !pools[0] && "pointer-events-none opacity-40",
            )}
          >
            Full hub →
          </Link>
        </div>
        <UpcomingFixtures />
      </section>

      {/* Your teams */}
      {teams.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">Your teams</h2>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <span key={t.id} className="pill flex items-center gap-2 bg-white/[0.04]">
                <Flag url={flagUrlFor(t)} code={t.shortCode} size="sm" />
                {t.name}
              </span>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

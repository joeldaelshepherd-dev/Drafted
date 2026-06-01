"use client";

import Link from "next/link";
import { Button, Card, Flag } from "@/components/ui";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { useProfile } from "@/lib/profile/store";
import { getWorldCupTeam, flagUrlFor } from "@/lib/data/wc2026";
import type { WorldCupTeam } from "@/lib/data/wc2026";

const DEMO_POOL = "20000000-0000-0000-0000-000000000001";

export function HomeGate() {
  const { profile, loading, clear } = useProfile();

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-8">
        <div className="skeleton h-9 w-40 rounded-xl" />
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-44 w-full rounded-2xl" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-5 py-12">
        <div>
          <h1 className="text-5xl font-black tracking-tight text-ink">Drafted</h1>
          <p className="mt-3 text-lg text-ink-muted">
            Invite-only fantasy football. Draft nations, run your pool, settle who really knows the
            game.
          </p>
        </div>
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">
            Create your player profile in under a minute — pick a nickname, an avatar, and the teams
            you back.
          </p>
          <Link href="/welcome">
            <Button className="w-full justify-center">Get started</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const teams = profile.supportedTeamIds
    .map((id) => getWorldCupTeam(id))
    .filter((t): t is WorldCupTeam => Boolean(t));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 py-8">
      <header className="flex items-center gap-3">
        <ProfileAvatar config={profile.avatar} name={`${profile.firstName} ${profile.lastName}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Welcome back</p>
          <p className="truncate text-lg font-black text-ink">{profile.nickname}</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="text-xs font-bold text-ink-faint hover:text-loss"
        >
          Sign out
        </button>
      </header>

      {teams.length > 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Your teams</p>
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <span key={t.id} className="pill flex items-center gap-2 bg-white/[0.04]">
                <Flag url={flagUrlFor(t)} code={t.shortCode} size="sm" />
                {t.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Your pool</p>
          <p className="text-lg font-black text-ink">Shepherd Family Syndicate</p>
        </div>
        <div className="grid gap-2">
          <Link href={`/pools/${DEMO_POOL}/draft`}>
            <Button variant="secondary" className="w-full justify-center">
              Draft room
            </Button>
          </Link>
          <Link href={`/pools/${DEMO_POOL}/my-teams`}>
            <Button variant="secondary" className="w-full justify-center">
              My teams
            </Button>
          </Link>
          <Link href={`/pools/${DEMO_POOL}/tournament`}>
            <Button variant="secondary" className="w-full justify-center">
              Tournament hub
            </Button>
          </Link>
        </div>
      </Card>

      <p className="px-1 text-center text-xs text-ink-faint">
        A full dashboard — join &amp; create pools, invites, and live fixtures — lands next.
      </p>
    </main>
  );
}

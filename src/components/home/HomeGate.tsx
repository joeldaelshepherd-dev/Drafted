"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { useProfile } from "@/lib/profile/store";

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

  return <Dashboard profile={profile} onSignOut={clear} />;
}

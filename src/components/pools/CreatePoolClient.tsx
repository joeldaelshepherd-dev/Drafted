"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { useProfile } from "@/lib/profile/store";
import { usePools } from "@/lib/pools/store";

export function CreatePoolClient() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const { createPool } = usePools();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-12">
        <div className="skeleton h-9 w-40 rounded-xl" />
        <div className="skeleton h-44 w-full rounded-2xl" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Create a pool</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Set up your player profile first, then you can start a pool.
          </p>
        </div>
        <Link href="/welcome">
          <Button className="w-full justify-center">Create my profile</Button>
        </Link>
      </main>
    );
  }

  const handleCreate = () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const adminName = profile.nickname || `${profile.firstName} ${profile.lastName}`.trim();
    const pool = createPool({ name, adminId: profile.id, adminName });
    router.push(`/pools/${pool.id}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-black text-ink">Create a pool</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Name your league, then invite your crew with a code or link.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <Label htmlFor="pool-name">Pool name</Label>
          <Input
            id="pool-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shepherd Family Syndicate"
            maxLength={48}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
        </div>
        <p className="text-xs text-ink-faint">
          You&apos;ll be the admin — you control when the draft starts. Playing FIFA World Cup
          2026.
        </p>
        <Button
          className="w-full justify-center"
          disabled={!name.trim() || submitting}
          onClick={handleCreate}
        >
          {submitting ? "Creating…" : "Create pool"}
        </Button>
      </Card>

      <Link href="/" className="text-center text-xs font-bold text-ink-faint hover:text-brand">
        ← Back to dashboard
      </Link>
    </main>
  );
}

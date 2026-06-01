"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { useProfile } from "@/lib/profile/store";
import { usePools } from "@/lib/pools/store";

export function JoinPoolClient() {
  const router = useRouter();
  const params = useSearchParams();
  const codeFromLink = (params.get("code") ?? "").toUpperCase();

  const { profile, loading } = useProfile();
  const { joinByCode } = usePools();

  const [code, setCode] = useState(codeFromLink);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const autoTried = useRef(false);

  const attempt = (raw: string): boolean => {
    if (!profile) return false;
    const member = {
      id: profile.id,
      name: profile.nickname || `${profile.firstName} ${profile.lastName}`.trim(),
    };
    const pool = joinByCode(raw, member);
    if (pool) {
      router.push(`/pools/${pool.id}`);
      return true;
    }
    setError("We couldn't find a pool with that code. Double-check and try again.");
    return false;
  };

  // Deep link: /pools/join?code=SHEP26 — auto-join once the profile is ready.
  useEffect(() => {
    if (autoTried.current || loading || !profile || !codeFromLink) return;
    autoTried.current = true;
    setSubmitting(true);
    if (!attempt(codeFromLink)) setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile, codeFromLink]);

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
          <h1 className="text-3xl font-black text-ink">Join a pool</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {codeFromLink
              ? `You've been invited with code ${codeFromLink}. Set up your profile and you'll drop straight in.`
              : "Set up your player profile first, then enter your invite code."}
          </p>
        </div>
        <Link href="/welcome">
          <Button className="w-full justify-center">Create my profile</Button>
        </Link>
      </main>
    );
  }

  const handleJoin = () => {
    if (!code.trim() || submitting) return;
    setError(null);
    setSubmitting(true);
    if (!attempt(code)) setSubmitting(false);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-black text-ink">Join a pool</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Got an invite code or link? You&apos;ll be in your pool in seconds.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <Label htmlFor="invite-code">Invite code</Label>
          <Input
            id="invite-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="e.g. SHEP26"
            autoCapitalize="characters"
            autoFocus
            className="uppercase tracking-[0.2em]"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
          />
          {error && <p className="mt-2 text-xs font-semibold text-loss">{error}</p>}
        </div>
        <Button
          className="w-full justify-center"
          disabled={!code.trim() || submitting}
          onClick={handleJoin}
        >
          {submitting ? "Joining…" : "Join pool"}
        </Button>
      </Card>

      <Link href="/" className="text-center text-xs font-bold text-ink-faint hover:text-brand">
        ← Back to dashboard
      </Link>
    </main>
  );
}

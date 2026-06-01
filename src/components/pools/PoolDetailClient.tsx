"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { usePools } from "@/lib/pools/store";
import {
  cancelDraftRecord,
  createDraftRecord,
  useDraftsForPool,
  type DraftRecordStatus,
} from "@/lib/draft/drafts-store";
import { cn, initials } from "@/lib/utils";

/**
 * WC2026 kicks off on 11 June 2026 (confirmed opening day, Mexico City). Used as
 * an honest tournament-start countdown; swap for the live schedule once wired.
 */
const TOURNAMENT_KICKOFF = "2026-06-11T18:00:00";

function remaining(target: number) {
  const ms = Math.max(0, target - Date.now());
  const sec = Math.floor(ms / 1000);
  return {
    done: ms === 0,
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    mins: Math.floor((sec % 3600) / 60),
    secs: sec % 60,
  };
}

function KickoffCountdown() {
  const target = useMemo(() => new Date(TOURNAMENT_KICKOFF).getTime(), []);
  const [t, setT] = useState<ReturnType<typeof remaining> | null>(null);

  useEffect(() => {
    setT(remaining(target));
    const id = setInterval(() => setT(remaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, number | null][] = [
    ["Days", t?.days ?? null],
    ["Hrs", t?.hours ?? null],
    ["Min", t?.mins ?? null],
    ["Sec", t?.secs ?? null],
  ];

  if (t?.done) {
    return <p className="text-sm font-black text-brand">The tournament is under way! ⚽</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map(([label, value]) => (
        <div key={label} className="glass flex flex-col items-center py-2">
          <span className="font-display text-2xl font-black tabular-nums text-ink">
            {value == null ? "—" : String(value).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button variant="secondary" size="sm" className="justify-center" onClick={copy}>
      {copied ? "Copied!" : label}
    </Button>
  );
}

const DRAFT_ROW_BADGE: Record<DraftRecordStatus, { label: string; className: string }> = {
  configuring: { label: "Setting up", className: "bg-gold/15 text-gold" },
  in_progress: { label: "Live", className: "bg-loss/20 text-loss" },
  complete: { label: "Drafted", className: "bg-brand/15 text-brand" },
  cancelled: { label: "Cancelled", className: "bg-ink/10 text-ink-faint" },
};

export function PoolDetailClient({ poolId }: { poolId: string }) {
  const router = useRouter();
  const { pools, loading } = usePools();
  const { drafts, loading: draftsLoading } = useDraftsForPool(poolId);
  const [inviteUrl, setInviteUrl] = useState("");

  const pool = pools.find((p) => p.id === poolId);

  const handleCreateDraft = () => {
    const record = createDraftRecord(poolId);
    router.push(`/pools/${poolId}/draft/${record.id}/setup`);
  };

  const handleCancelDraft = (draftId: string) => {
    cancelDraftRecord(draftId);
  };

  useEffect(() => {
    if (pool) {
      setInviteUrl(`${window.location.origin}/pools/join?code=${pool.inviteCode}`);
    }
  }, [pool]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-8">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </main>
    );
  }

  if (!pool) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Pool not found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This pool isn&apos;t on your device. If a friend sent you a link, ask them for the
            invite code instead.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/pools/join">
            <Button variant="secondary" className="w-full justify-center">
              Enter a code
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full justify-center">Dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  const activeDrafts = drafts.filter((d) => d.status !== "cancelled");
  const summary: { label: string; className: string } = activeDrafts.some(
    (d) => d.status === "in_progress",
  )
    ? { label: "Draft live", className: "bg-loss/20 text-loss" }
    : activeDrafts.some((d) => d.status === "complete")
      ? { label: "Drafted", className: "bg-brand/15 text-brand" }
      : activeDrafts.some((d) => d.status === "configuring")
        ? { label: "Draft setup", className: "bg-gold/15 text-gold" }
        : { label: "No drafts yet", className: "bg-gold/15 text-gold" };

  const shareText = `Join my "${pool.name}" pool on Drafted for the FIFA World Cup 2026! Use code ${pool.inviteCode} or tap: ${inviteUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    `Join my Drafted pool: ${pool.name}`,
  )}&body=${encodeURIComponent(shareText)}`;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <Link href="/" className="text-xs font-bold text-ink-faint hover:text-brand">
        ← Back to dashboard
      </Link>

      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-black text-ink">{pool.name}</h1>
          <p className="text-xs text-ink-muted">
            {pool.tournamentName} · {pool.members.length}{" "}
            {pool.members.length === 1 ? "manager" : "managers"}
            {pool.isAdmin ? " · You're admin" : ""}
          </p>
        </div>
        <span className={cn("pill shrink-0", summary.className)}>{summary.label}</span>
      </header>

      {/* Countdown to first match */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Kick-off countdown
        </h2>
        <KickoffCountdown />
        <p className="text-[11px] text-ink-faint">
          WC2026 opening match · 11 June 2026, Mexico City.
        </p>
      </section>

      {/* Invite */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Invite your crew
        </h2>
        <Card glow className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
              Invite code
            </span>
            <span className="font-display text-4xl font-black tracking-[0.3em] text-brand">
              {pool.inviteCode}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CopyButton label="Copy code" value={pool.inviteCode} />
            <CopyButton label="Copy link" value={inviteUrl} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" className="w-full justify-center">
                WhatsApp
              </Button>
            </a>
            <a href={emailUrl}>
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Email
              </Button>
            </a>
          </div>
          <p className="text-[11px] text-ink-faint">
            Anyone with the code or link can join — they&apos;ll land straight in this pool after
            setting up their profile.
          </p>
        </Card>
      </section>

      {/* Participants */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
          Managers ({pool.members.length})
        </h2>
        <Card className="flex flex-col gap-1 p-2">
          {pool.members.map((m) => {
            const isAdmin = m.id === pool.adminId;
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-black text-brand">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {m.name}
                </span>
                {isAdmin && (
                  <span className="pill shrink-0 bg-gold/15 text-gold">Admin</span>
                )}
              </div>
            );
          })}
        </Card>
      </section>

      {/* Drafts — a pool can run several at once */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Drafts ({activeDrafts.length})
          </h2>
          {pool.isAdmin && (
            <Button size="sm" className="justify-center" onClick={handleCreateDraft}>
              + New draft
            </Button>
          )}
        </div>

        {draftsLoading ? (
          <div className="skeleton h-20 w-full rounded-2xl" />
        ) : drafts.length === 0 ? (
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-ink-muted">
              {pool.isAdmin
                ? "No drafts yet. Spin one up, set the format, clock and squad size, then launch into the pre-draft lobby."
                : "No drafts yet. Waiting for the admin to set one up — you'll be notified when it's live."}
            </p>
            {pool.isAdmin && (
              <Button className="w-full justify-center" onClick={handleCreateDraft}>
                Set up a draft
              </Button>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {drafts.map((d) => {
              const rowBadge = DRAFT_ROW_BADGE[d.status];
              return (
                <Card key={d.id} className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{d.name}</p>
                      <p className="text-[11px] text-ink-faint">
                        {d.settings.style === "auction"
                          ? "Auction"
                          : d.settings.style === "hybrid"
                            ? "Hybrid auction"
                            : d.settings.format === "snake"
                              ? "Snake draft"
                              : d.settings.format === "balanced-random"
                                ? "Balanced random draft"
                                : "Standard draft"}
                      </p>
                    </div>
                    <span className={cn("pill shrink-0", rowBadge.className)}>{rowBadge.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {d.status === "configuring" && (
                      <>
                        <Link href={`/pools/${pool.id}/draft/${d.id}/setup`}>
                          <Button size="sm" className="w-full justify-center">
                            {pool.isAdmin ? "Edit setup" : "View setup"}
                          </Button>
                        </Link>
                        {pool.isAdmin && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => handleCancelDraft(d.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    )}

                    {d.status === "in_progress" && (
                      <>
                        <Link href={`/pools/${pool.id}/draft/${d.id}`}>
                          <Button size="sm" className="w-full justify-center">
                            Enter room
                          </Button>
                        </Link>
                        {pool.isAdmin && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => handleCancelDraft(d.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </>
                    )}

                    {d.status === "complete" && (
                      <Link href={`/pools/${pool.id}/my-teams`} className="col-span-2">
                        <Button size="sm" className="w-full justify-center">
                          View results
                        </Button>
                      </Link>
                    )}

                    {d.status === "cancelled" && pool.isAdmin && (
                      <Link href={`/pools/${pool.id}/draft/${d.id}/setup`} className="col-span-2">
                        <Button variant="secondary" size="sm" className="w-full justify-center">
                          Reopen setup
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick links */}
      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/pools/${pool.id}/my-teams`}>
            <Button variant="secondary" size="sm" className="w-full justify-center">
              My teams
            </Button>
          </Link>
          <Link href={`/pools/${pool.id}/tournament`}>
            <Button variant="secondary" size="sm" className="w-full justify-center">
              Tournament hub
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

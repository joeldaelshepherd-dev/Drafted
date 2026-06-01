"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { usePools } from "@/lib/pools/store";
import { useDraftConfig, DEFAULT_DRAFT_SETTINGS } from "@/lib/draft/config-store";
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import type {
  AllocationMode,
  DraftFormat,
  DraftOrderMode,
  DraftSettings,
  DraftStyle,
} from "@/lib/draft/types";
import { cn } from "@/lib/utils";

const TOTAL_TEAMS = WC2026_TEAMS.length; // 48

const CLOCK_OPTIONS: { secs: number; label: string }[] = [
  { secs: 30, label: "Lightning" },
  { secs: 45, label: "Brisk" },
  { secs: 60, label: "Classic" },
  { secs: 90, label: "Relaxed" },
  { secs: 120, label: "Chilled" },
];

const BUDGET_OPTIONS = [100, 150, 200, 300, 500];

type ToggleKey =
  | "autoPick"
  | "announcements"
  | "draftChat"
  | "soundEffects"
  | "predictionGame"
  | "allowCoAdmins"
  | "postDraftTrading"
  | "pushNotifications";

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "autoPick", label: "Auto-pick", hint: "If the clock runs out, draft the top team from that manager's queue." },
  { key: "announcements", label: "Pick announcements", hint: "Celebrate every pick with an on-screen shout-out." },
  { key: "draftChat", label: "Draft-room chat", hint: "Let managers banter live during the draft." },
  { key: "soundEffects", label: "Sound effects", hint: "Clock ticks, pick stings and the buzzer." },
  { key: "predictionGame", label: "Prediction game", hint: "Side-bets on results alongside the main pool." },
  { key: "allowCoAdmins", label: "Allow co-admins", hint: "Trusted managers can pause or help run the draft." },
  { key: "postDraftTrading", label: "Post-draft trading", hint: "Managers can swap nations after the draft ends." },
  { key: "pushNotifications", label: "Push reminders", hint: "Nudge managers when they're on the clock." },
];

/** Labelled steps for a style — Format is draft-only; Budget is auction/hybrid-only. */
function stepsFor(style: DraftStyle): string[] {
  if (style === "auction" || style === "hybrid") {
    return ["Style", "Clock", "Squads", "Budget", "Order", "Experience", "Launch"];
  }
  return ["Style", "Format", "Clock", "Squads", "Order", "Experience", "Launch"];
}

function StepDots({ steps, step }: { steps: string[]; step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((label, i) => (
        <div
          key={label}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i < step ? "bg-brand" : i === step ? "bg-brand/60" : "bg-white/10",
          )}
        />
      ))}
    </div>
  );
}

function OptionCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tap flex w-full flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-brand bg-brand/10"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
      )}
    >
      <span className="flex items-center gap-2 text-base font-black text-ink">
        <span
          className={cn(
            "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
            active ? "border-brand" : "border-white/25",
          )}
        >
          {active && <span className="h-2 w-2 rounded-full bg-brand" />}
        </span>
        {title}
      </span>
      <span className="pl-6 text-xs leading-relaxed text-ink-muted">{desc}</span>
    </button>
  );
}

function ToggleRow({
  on,
  label,
  hint,
  onToggle,
}: {
  on: boolean;
  label: string;
  hint: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="tap flex w-full items-start gap-3 rounded-xl px-1 py-2 text-left"
    >
      <span
        className={cn(
          "mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors",
          on ? "bg-brand" : "bg-white/15",
        )}
      >
        <span
          className={cn(
            "h-5 w-5 rounded-full bg-white transition-transform",
            on ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="block text-xs leading-snug text-ink-faint">{hint}</span>
      </span>
    </button>
  );
}

export function DraftSetupWizard({ poolId }: { poolId: string }) {
  const router = useRouter();
  const { pools, loading: poolsLoading, startDraft } = usePools();
  const { settings: saved, loading: configLoading, saveSettings } = useDraftConfig(poolId);

  const pool = pools.find((p) => p.id === poolId);
  const loading = poolsLoading || configLoading;

  const [form, setForm] = useState<DraftSettings>(DEFAULT_DRAFT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [launchCount, setLaunchCount] = useState<number | null>(null);

  // Hydrate the form from any previously-saved settings, once.
  useEffect(() => {
    if (!configLoading && !hydrated) {
      if (saved) setForm(saved);
      setHydrated(true);
    }
  }, [configLoading, saved, hydrated]);

  const steps = stepsFor(form.style);
  const stepName = steps[Math.min(step, steps.length - 1)];
  const isAuction = form.style === "auction" || form.style === "hybrid";

  const members = pool?.members.length ?? 0;
  const maxPerUser = Math.max(1, Math.min(8, Math.floor(TOTAL_TEAMS / Math.max(1, members))));

  const rounds = useMemo(() => {
    if (form.allocationMode === "fixed") {
      return Math.max(1, Math.min(form.teamsPerUser, maxPerUser));
    }
    return Math.max(1, Math.floor(TOTAL_TEAMS / Math.max(1, members)));
  }, [form.allocationMode, form.teamsPerUser, maxPerUser, members]);

  const totalPicks = rounds * members;
  const maxMarquee = Math.max(1, Math.min(TOTAL_TEAMS, rounds * Math.max(1, members)));

  // Launch countdown → persist, flip pool to in-progress, enter the lobby.
  useEffect(() => {
    if (launchCount === null || !pool) return;
    if (launchCount <= 0) {
      startDraft(pool.id);
      router.push(`/pools/${pool.id}/draft`);
      return;
    }
    const id = setTimeout(() => setLaunchCount((n) => (n === null ? null : n - 1)), 850);
    return () => clearTimeout(id);
  }, [launchCount, pool, router, startDraft]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-8">
        <div className="skeleton h-6 w-40 rounded-lg" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
      </main>
    );
  }

  if (!pool) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Pool not found</h1>
          <p className="mt-2 text-sm text-ink-muted">
            This pool isn&apos;t on your device, so there&apos;s nothing to set up here.
          </p>
        </div>
        <Link href="/">
          <Button className="w-full justify-center">Back to dashboard</Button>
        </Link>
      </main>
    );
  }

  if (!pool.isAdmin) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
        <div>
          <h1 className="text-3xl font-black text-ink">Admins only</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Only the pool admin can set up the draft. Hang tight — you&apos;ll be pulled into the
            lobby the moment they launch it.
          </p>
        </div>
        <Link href={`/pools/${pool.id}`}>
          <Button variant="secondary" className="w-full justify-center">
            Back to pool
          </Button>
        </Link>
      </main>
    );
  }

  const set = <K extends keyof DraftSettings>(key: K, value: DraftSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clockLabel =
    CLOCK_OPTIONS.find((c) => c.secs === form.pickSeconds)?.label ?? `${form.pickSeconds}s`;

  const styleLabel =
    form.style === "auction" ? "Auction" : form.style === "hybrid" ? "Hybrid auction" : "Draft";

  const beginLaunch = () => {
    const finalForm: DraftSettings = {
      ...form,
      teamsPerUser: form.allocationMode === "fixed" ? rounds : form.teamsPerUser,
      marqueeCount: Math.max(1, Math.min(form.marqueeCount, maxMarquee)),
    };
    saveSettings(finalForm);
    setLaunchCount(3);
  };

  const isLast = step >= steps.length - 1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 py-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/pools/${pool.id}`}
          className="text-xs font-bold text-ink-faint hover:text-brand"
        >
          ← {pool.name}
        </Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
            Step {step + 1} of {steps.length} · {stepName}
          </p>
          <h1 className="text-3xl font-black text-ink">Set up the draft</h1>
        </div>
        <StepDots steps={steps} step={step} />
      </div>

      {/* Style */}
      {stepName === "Style" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            How do managers land their nations?
          </h2>
          <OptionCard
            active={form.style === "draft"}
            title="Snake / standard draft"
            desc="Managers take turns picking nations from the board. Classic, simple, and quick to run."
            onClick={() => set("style", "draft" as DraftStyle)}
          />
          <OptionCard
            active={form.style === "auction"}
            title="Auction"
            desc="Every nation goes under the hammer. Managers nominate and bid credits — the deepest pockets land the favourites."
            onClick={() => set("style", "auction" as DraftStyle)}
          />
          <OptionCard
            active={form.style === "hybrid"}
            title="Hybrid auction"
            desc="Bid for the marquee nations only; the rest of each squad is filled automatically by a fair needs-based draft."
            onClick={() => set("style", "hybrid" as DraftStyle)}
          />
        </section>
      )}

      {/* Format (draft only) */}
      {stepName === "Format" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            How does the order run?
          </h2>
          <OptionCard
            active={form.format === "snake"}
            title="Snake draft"
            desc="The order reverses each round (1→8, then 8→1). Fairer — whoever picks last gets first dibs next round. The crowd favourite."
            onClick={() => set("format", "snake" as DraftFormat)}
          />
          <OptionCard
            active={form.format === "standard"}
            title="Standard draft"
            desc="Same order every round (1→8, 1→8…). Simple and predictable, but pick #1 keeps the edge."
            onClick={() => set("format", "standard" as DraftFormat)}
          />
        </section>
      )}

      {/* Clock */}
      {stepName === "Clock" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            {isAuction ? "Seconds to nominate a nation" : "Seconds on the clock per pick"}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {CLOCK_OPTIONS.map((c) => {
              const active = form.pickSeconds === c.secs;
              return (
                <button
                  key={c.secs}
                  type="button"
                  onClick={() => set("pickSeconds", c.secs)}
                  className={cn(
                    "tap flex flex-col items-center gap-0.5 rounded-2xl border py-3 transition-colors",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span className="font-display text-2xl font-black tabular-nums text-ink">
                    {c.secs}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-faint">
            {isAuction
              ? "Bidding stays open for a short window that resets on every fresh bid, so a hot lot keeps running until the room goes quiet."
              : "Auto-pick (if on) fills the slot the moment the clock hits zero, so no one ever stalls the draft."}
          </p>
        </section>
      )}

      {/* Squads */}
      {stepName === "Squads" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            How many nations per manager?
          </h2>
          <OptionCard
            active={form.allocationMode === "fixed"}
            title="Set squad size"
            desc="Every manager ends up with the same fixed number of nations."
            onClick={() => set("allocationMode", "fixed" as AllocationMode)}
          />
          {form.allocationMode === "fixed" && (
            <Card className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">Nations each</p>
                <p className="text-[11px] text-ink-faint">Up to {maxPerUser} with {members} managers.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 w-9 justify-center p-0 text-lg"
                  onClick={() =>
                    set("teamsPerUser", Math.max(1, Math.min(form.teamsPerUser, maxPerUser) - 1))
                  }
                  disabled={Math.min(form.teamsPerUser, maxPerUser) <= 1}
                >
                  −
                </Button>
                <span className="w-8 text-center font-display text-2xl font-black tabular-nums text-brand">
                  {Math.min(form.teamsPerUser, maxPerUser)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 w-9 justify-center p-0 text-lg"
                  onClick={() =>
                    set("teamsPerUser", Math.min(maxPerUser, Math.min(form.teamsPerUser, maxPerUser) + 1))
                  }
                  disabled={Math.min(form.teamsPerUser, maxPerUser) >= maxPerUser}
                >
                  +
                </Button>
              </div>
            </Card>
          )}
          <OptionCard
            active={form.allocationMode === "all"}
            title="Split every nation"
            desc={`Share all ${TOTAL_TEAMS} nations out as evenly as possible — about ${Math.max(
              1,
              Math.floor(TOTAL_TEAMS / Math.max(1, members)),
            )} each with ${members} managers.`}
            onClick={() => set("allocationMode", "all" as AllocationMode)}
          />
          <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-ink-muted">
            That&apos;s <span className="font-bold text-ink">{rounds}</span>{" "}
            {rounds === 1 ? "round" : "rounds"} ·{" "}
            <span className="font-bold text-ink">{totalPicks}</span> total nations across{" "}
            {members} {members === 1 ? "manager" : "managers"}.
          </p>
        </section>
      )}

      {/* Budget (auction / hybrid only) */}
      {stepName === "Budget" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Credits each manager starts with
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {BUDGET_OPTIONS.map((b) => {
              const active = form.budget === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => set("budget", b)}
                  className={cn(
                    "tap flex flex-col items-center gap-0.5 rounded-2xl border py-3 transition-colors",
                    active
                      ? "border-brand bg-brand/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  )}
                >
                  <span className="font-display text-2xl font-black tabular-nums text-gold">{b}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                    credits
                  </span>
                </button>
              );
            })}
          </div>
          {form.style === "hybrid" && (
            <Card className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">Nations on the block</p>
                <p className="text-[11px] text-ink-faint">
                  The top {Math.max(1, Math.min(form.marqueeCount, maxMarquee))} ranked nations go to
                  auction; the rest fill automatically.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 w-9 justify-center p-0 text-lg"
                  onClick={() =>
                    set("marqueeCount", Math.max(1, Math.min(form.marqueeCount, maxMarquee) - 1))
                  }
                  disabled={Math.min(form.marqueeCount, maxMarquee) <= 1}
                >
                  −
                </Button>
                <span className="w-8 text-center font-display text-2xl font-black tabular-nums text-brand">
                  {Math.max(1, Math.min(form.marqueeCount, maxMarquee))}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 w-9 justify-center p-0 text-lg"
                  onClick={() =>
                    set("marqueeCount", Math.min(maxMarquee, Math.min(form.marqueeCount, maxMarquee) + 1))
                  }
                  disabled={Math.min(form.marqueeCount, maxMarquee) >= maxMarquee}
                >
                  +
                </Button>
              </div>
            </Card>
          )}
          <p className="text-[11px] text-ink-faint">
            {form.style === "hybrid"
              ? "Spend freely on the marquee nations — any credits left over don't carry into the fill draft."
              : "Hold one credit in reserve for every slot you still need, so you can always complete a full squad."}
          </p>
        </section>
      )}

      {/* Order */}
      {stepName === "Order" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            {isAuction ? "Who nominates first?" : "Who picks first?"}
          </h2>
          <OptionCard
            active={form.orderMode === "random"}
            title="Random shuffle"
            desc="The order is shuffled the moment the draft launches. Pure luck — and a fun reveal in the lobby."
            onClick={() => set("orderMode", "random" as DraftOrderMode)}
          />
          <OptionCard
            active={form.orderMode === "manual"}
            title="Join order"
            desc="Managers go in the order they joined the pool. Predictable, and you stay in control."
            onClick={() => set("orderMode", "manual" as DraftOrderMode)}
          />
        </section>
      )}

      {/* Experience */}
      {stepName === "Experience" && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Draft-night extras
          </h2>
          <Card className="flex flex-col gap-1 p-2">
            {TOGGLES.map((t) => (
              <ToggleRow
                key={t.key}
                on={form[t.key]}
                label={t.label}
                hint={t.hint}
                onToggle={() => set(t.key, !form[t.key])}
              />
            ))}
          </Card>
        </section>
      )}

      {/* Launch */}
      {stepName === "Launch" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            Review &amp; launch
          </h2>
          <Card glow className="flex flex-col gap-3">
            <dl className="flex flex-col divide-y divide-white/5 text-sm">
              {[
                ["Style", styleLabel],
                ...(isAuction
                  ? ([
                      ["Credits each", `${form.budget}`],
                      ...(form.style === "hybrid"
                        ? ([["On the block", `Top ${Math.max(1, Math.min(form.marqueeCount, maxMarquee))} nations`]] as [string, string][])
                        : []),
                      ["Nominate clock", `${form.pickSeconds}s · ${clockLabel}`],
                    ] as [string, string][])
                  : ([
                      ["Format", form.format === "snake" ? "Snake draft" : "Standard draft"],
                      ["Pick clock", `${form.pickSeconds}s · ${clockLabel}`],
                    ] as [string, string][])),
                [
                  "Squads",
                  form.allocationMode === "fixed"
                    ? `${rounds} nations each`
                    : `All ${TOTAL_TEAMS} split (${rounds} each)`,
                ],
                ["Total nations", `${totalPicks} across ${members} managers`],
                ["Order", form.orderMode === "random" ? "Random shuffle" : "Join order"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-ink-faint">
              Launching opens the pre-draft lobby for{" "}
              <span className="font-bold text-ink">{pool.name}</span>. Everyone gathers there, then
              you kick off the live {isAuction ? "auction" : "draft"} when the crew is ready.
            </p>
          </Card>
          <Button size="lg" className="w-full justify-center" onClick={beginLaunch}>
            Launch the {isAuction ? "auction" : "draft"} 🚀
          </Button>
        </section>
      )}

      {/* Nav */}
      <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
        <Button
          variant="secondary"
          className="w-full justify-center"
          onClick={() => (step === 0 ? router.push(`/pools/${pool.id}`) : setStep((s) => s - 1))}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {!isLast ? (
          <Button className="w-full justify-center" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full justify-center"
            onClick={() => setStep(0)}
          >
            Start over
          </Button>
        )}
      </div>

      {/* Launch countdown overlay */}
      {launchCount !== null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand">
              Launching the {isAuction ? "auction" : "draft"}
            </p>
            <span
              key={launchCount}
              className="font-display text-7xl font-black tabular-nums text-ink animate-pop-in"
            >
              {launchCount === 0 ? "GO" : launchCount}
            </span>
            <p className="text-sm text-ink-muted">Opening the lobby for {pool.name}…</p>
          </div>
        </div>
      )}
    </main>
  );
}

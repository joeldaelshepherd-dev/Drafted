"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { usePools } from "@/lib/pools/store";
import { DEFAULT_DRAFT_SETTINGS } from "@/lib/draft/config-store";
import {
  saveDraftSettings,
  setDraftStatus,
  useDraftRecord,
} from "@/lib/draft/drafts-store";
import { WC2026_TEAMS } from "@/lib/data/wc2026";
import type {
  DraftFormat,
  DraftOrderMode,
  DraftSettings,
  DraftStyle,
  SquadMode,
  SubsequentFormat,
} from "@/lib/draft/types";
import { cn } from "@/lib/utils";
import { ManualOrderEditor } from "./ManualOrderEditor";

const TOTAL_TEAMS = WC2026_TEAMS.length; // 48

const CLOCK_OPTIONS: { secs: number; label: string }[] = [
  { secs: 30, label: "Lightning" },
  { secs: 45, label: "Brisk" },
  { secs: 60, label: "Classic" },
  { secs: 90, label: "Relaxed" },
  { secs: 120, label: "Chilled" },
];

const BUDGET_OPTIONS = [100, 150, 200, 300, 500];

/** Nations on the board / auction block. Decoupled from squad size. */
const BOARD_OPTIONS: { size: number; label: string }[] = [
  { size: TOTAL_TEAMS, label: "All 48" },
  { size: 24, label: "Top 2 / group" },
  { size: 20, label: "Top 20" },
  { size: 15, label: "Top 15" },
  { size: 10, label: "Top 10" },
];

/** The five first-class styles the wizard opens on (Step 1 folds in old Format). */
type StyleKey = "snake" | "standard" | "balanced" | "auction" | "hybrid";

const STYLE_OPTIONS: { key: StyleKey; title: string; desc: string }[] = [
  {
    key: "snake",
    title: "Snake draft",
    desc: "Managers take turns; the order reverses each round (1→8, then 8→1). Fairest pick draft — the crowd favourite.",
  },
  {
    key: "standard",
    title: "Standard draft",
    desc: "Same pick order every round (1→8, 1→8…). Simple and predictable, but pick #1 keeps the edge.",
  },
  {
    key: "balanced",
    title: "Balanced random",
    desc: "A fresh random order every single round, so early and late luck even out over the draft.",
  },
  {
    key: "auction",
    title: "Auction",
    desc: "Every nation goes under the hammer. Managers nominate and bid credits — deepest pockets land the favourites.",
  },
  {
    key: "hybrid",
    title: "Hybrid auction",
    desc: "Bid for the marquee nations only; the rest of each squad fills automatically via a fair free draft.",
  },
];

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

/** Auction/Hybrid gain an extra "Auction" step (budget + bid timer + marquee). */
function stepsFor(style: DraftStyle): string[] {
  if (style === "auction" || style === "hybrid") {
    return ["Style", "Clock", "Squads", "Auction", "Order", "Experience", "Launch"];
  }
  return ["Style", "Clock", "Squads", "Order", "Experience", "Launch"];
}

function styleKeyOf(form: DraftSettings): StyleKey {
  if (form.style === "auction") return "auction";
  if (form.style === "hybrid") return "hybrid";
  if (form.format === "standard") return "standard";
  if (form.format === "balanced-random") return "balanced";
  return "snake";
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

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const clamped = Math.max(min, Math.min(value, max));
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        className="h-9 w-9 justify-center p-0 text-lg"
        onClick={() => onChange(Math.max(min, clamped - 1))}
        disabled={clamped <= min}
      >
        −
      </Button>
      <span className="w-14 text-center font-display text-2xl font-black tabular-nums text-brand">
        {clamped}
        {suffix ? <span className="text-sm text-ink-faint">{suffix}</span> : null}
      </span>
      <Button
        variant="secondary"
        size="sm"
        className="h-9 w-9 justify-center p-0 text-lg"
        onClick={() => onChange(Math.min(max, clamped + 1))}
        disabled={clamped >= max}
      >
        +
      </Button>
    </div>
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

export function DraftSetupWizard({ poolId, draftId }: { poolId: string; draftId: string }) {
  const router = useRouter();
  const { pools, loading: poolsLoading, startDraft } = usePools();
  const { draft, loading: draftLoading } = useDraftRecord(draftId);

  const pool = pools.find((p) => p.id === poolId);
  const loading = poolsLoading || draftLoading;

  const [form, setForm] = useState<DraftSettings>(DEFAULT_DRAFT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState(0);
  const [launchCount, setLaunchCount] = useState<number | null>(null);

  // Hydrate the form from the draft record's saved settings, once.
  useEffect(() => {
    if (!draftLoading && !hydrated) {
      if (draft) setForm({ ...DEFAULT_DRAFT_SETTINGS, ...draft.settings });
      setHydrated(true);
    }
  }, [draftLoading, draft, hydrated]);

  const steps = stepsFor(form.style);
  const stepName = steps[Math.min(step, steps.length - 1)];
  const isAuction = form.style === "auction" || form.style === "hybrid";
  const styleKey = styleKeyOf(form);

  const members = pool?.members.length ?? 0;
  const board = Math.max(1, Math.min(form.boardSize || TOTAL_TEAMS, TOTAL_TEAMS));
  // A fixed squad can't exceed what the board can supply across all managers.
  const maxPerUser = Math.max(1, Math.floor(board / Math.max(1, members)));

  const rounds = useMemo(() => {
    if (form.squadMode === "fixed") {
      return Math.max(1, Math.min(form.teamsPerUser, maxPerUser));
    }
    return Math.max(1, Math.floor(board / Math.max(1, members)));
  }, [form.squadMode, form.teamsPerUser, maxPerUser, board, members]);

  const totalPicks = rounds * members;
  const maxMarquee = Math.max(1, board);

  // Launch countdown → flip status, flip the coarse pool flag, enter the room.
  useEffect(() => {
    if (launchCount === null || !pool) return;
    if (launchCount <= 0) {
      setDraftStatus(draftId, "in_progress");
      startDraft(pool.id);
      router.push(`/pools/${pool.id}/draft/${draftId}`);
      return;
    }
    const id = setTimeout(() => setLaunchCount((n) => (n === null ? null : n - 1)), 850);
    return () => clearTimeout(id);
  }, [launchCount, pool, router, startDraft, draftId]);

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
            room the moment they launch it.
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

  const selectStyle = (key: StyleKey) =>
    setForm((f) => {
      switch (key) {
        case "snake":
          return { ...f, style: "draft" as DraftStyle, format: "snake" as DraftFormat };
        case "standard":
          return { ...f, style: "draft" as DraftStyle, format: "standard" as DraftFormat };
        case "balanced":
          return { ...f, style: "draft" as DraftStyle, format: "balanced-random" as DraftFormat };
        case "auction":
          return { ...f, style: "auction" as DraftStyle };
        case "hybrid":
          return { ...f, style: "hybrid" as DraftStyle };
        default:
          return f;
      }
    });

  const clockLabel =
    CLOCK_OPTIONS.find((c) => c.secs === form.pickSeconds)?.label ?? `${form.pickSeconds}s`;

  const styleLabel = STYLE_OPTIONS.find((s) => s.key === styleKey)?.title ?? "Draft";
  const boardLabel = BOARD_OPTIONS.find((b) => b.size === board)?.label ?? `Top ${board}`;
  const squadLabel =
    form.squadMode === "fixed"
      ? `${rounds} nations each`
      : form.squadMode === "split-top"
        ? `Split the top ${board} (${rounds} each)`
        : `Split ${board} nations (${rounds} each)`;

  const beginLaunch = () => {
    const finalForm: DraftSettings = {
      ...form,
      boardSize: board,
      teamsPerUser: form.squadMode === "fixed" ? rounds : form.teamsPerUser,
      marqueeCount: Math.max(1, Math.min(form.marqueeCount, maxMarquee)),
    };
    saveDraftSettings(draftId, finalForm);
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
          <h1 className="text-3xl font-black text-ink">{draft?.name ?? "Set up the draft"}</h1>
        </div>
        <StepDots steps={steps} step={step} />
      </div>

      {/* Style */}
      {stepName === "Style" && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
            How do managers land their nations?
          </h2>
          {STYLE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.key}
              active={styleKey === opt.key}
              title={opt.title}
              desc={opt.desc}
              onClick={() => selectStyle(opt.key)}
            />
          ))}
        </section>
      )}

      {/* Clock (unified for all styles) */}
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
              ? "This is the nomination clock. The live bid window (and its anti-snipe extend) is set on the next step."
              : "Auto-pick (if on) fills the slot the moment the clock hits zero, so no one ever stalls the draft."}
          </p>
        </section>
      )}

      {/* Squads — squad size AND nations-on-the-block, fully decoupled */}
      {stepName === "Squads" && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              How big is each squad?
            </h2>
            <OptionCard
              active={form.squadMode === "fixed"}
              title="Set squad size"
              desc="Every manager ends up with the same fixed number of nations."
              onClick={() => set("squadMode", "fixed" as SquadMode)}
            />
            {form.squadMode === "fixed" && (
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-ink">Nations each</p>
                  <p className="text-[11px] text-ink-faint">
                    Up to {maxPerUser} with {members} {members === 1 ? "manager" : "managers"} on a{" "}
                    {board}-nation board.
                  </p>
                </div>
                <Stepper
                  value={Math.min(form.teamsPerUser, maxPerUser)}
                  min={1}
                  max={maxPerUser}
                  onChange={(n) => set("teamsPerUser", n)}
                />
              </Card>
            )}
            <OptionCard
              active={form.squadMode === "split-all"}
              title="Split every nation"
              desc="Share the whole board out as evenly as possible — every nation gets an owner."
              onClick={() => set("squadMode", "split-all" as SquadMode)}
            />
            <OptionCard
              active={form.squadMode === "split-top"}
              title="Split the top nations only"
              desc="Only the best nations on the board are in play, shared out evenly. Tighter, higher-quality squads."
              onClick={() => set("squadMode", "split-top" as SquadMode)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wide text-ink-muted">
              Nations on the {isAuction ? "block" : "board"}
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {BOARD_OPTIONS.map((b) => {
                const active = board === b.size;
                return (
                  <button
                    key={b.size}
                    type="button"
                    onClick={() => set("boardSize", b.size)}
                    className={cn(
                      "tap flex flex-col items-center gap-0.5 rounded-2xl border py-3 transition-colors",
                      active
                        ? "border-brand bg-brand/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                    )}
                  >
                    <span className="font-display text-2xl font-black tabular-nums text-ink">
                      {b.size}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                      {b.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-faint">
              This sets how many nations are in play — completely separate from squad size.
            </p>
          </div>

          <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-ink-muted">
            That&apos;s <span className="font-bold text-ink">{rounds}</span>{" "}
            {rounds === 1 ? "round" : "rounds"} ·{" "}
            <span className="font-bold text-ink">{totalPicks}</span> nations drafted across{" "}
            {members} {members === 1 ? "manager" : "managers"}.
          </p>
        </section>
      )}

      {/* Auction (auction / hybrid only) — budget + bid timer + marquee */}
      {stepName === "Auction" && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
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
                    <span className="font-display text-2xl font-black tabular-nums text-gold">
                      {b}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">
                      credits
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Bid clock</p>
              <p className="text-[11px] text-ink-faint">
                Seconds the live bidding stays open on each lot.
              </p>
            </div>
            <Stepper
              value={form.bidSeconds}
              min={5}
              max={60}
              onChange={(n) => set("bidSeconds", n)}
              suffix="s"
            />
          </Card>

          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-ink">Anti-snipe extend</p>
              <p className="text-[11px] text-ink-faint">
                A late bid pushes the clock back to this, so no one steals a lot at the buzzer.
              </p>
            </div>
            <Stepper
              value={form.bidExtendSeconds}
              min={0}
              max={30}
              onChange={(n) => set("bidExtendSeconds", n)}
              suffix="s"
            />
          </Card>

          {form.style === "hybrid" && (
            <Card className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink">Nations auctioned</p>
                <p className="text-[11px] text-ink-faint">
                  The top {Math.max(1, Math.min(form.marqueeCount, maxMarquee))} go to auction; the
                  rest fill via a free draft.
                </p>
              </div>
              <Stepper
                value={Math.min(form.marqueeCount, maxMarquee)}
                min={1}
                max={maxMarquee}
                onChange={(n) => set("marqueeCount", n)}
              />
            </Card>
          )}

          <p className="text-[11px] text-ink-faint">
            Opening bids start at 10% of the budget, with a 5% minimum raise. Unsold nations are
            re-offered once, then handed out free at the end so every squad is complete.
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
            title="Set the order by hand"
            desc="Arrange the managers yourself for round 1, then choose how the later rounds run."
            onClick={() => set("orderMode", "manual" as DraftOrderMode)}
          />
          {form.orderMode === "manual" && pool && (
            <ManualOrderEditor
              members={pool.members.map((m) => ({ id: m.id, name: m.name }))}
              value={form.manualFirstRoundOrder ?? pool.members.map((m) => m.id)}
              onChange={(ids) => set("manualFirstRoundOrder", ids)}
              subsequentFormat={form.subsequentFormat}
              onSubsequentChange={(f: SubsequentFormat) => set("subsequentFormat", f)}
            />
          )}
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
                      ["Nominate clock", `${form.pickSeconds}s · ${clockLabel}`],
                      [
                        "Bid clock",
                        `${form.bidSeconds}s · +${form.bidExtendSeconds}s anti-snipe`,
                      ],
                      ...(form.style === "hybrid"
                        ? ([
                            [
                              "Auctioned",
                              `Top ${Math.max(1, Math.min(form.marqueeCount, maxMarquee))} nations`,
                            ],
                          ] as [string, string][])
                        : []),
                    ] as [string, string][])
                  : ([["Pick clock", `${form.pickSeconds}s · ${clockLabel}`]] as [string, string][])),
                ["On the block", `${boardLabel} (${board})`],
                ["Squads", squadLabel],
                ["Total nations", `${totalPicks} across ${members} managers`],
                [
                  "Order",
                  form.orderMode === "random"
                    ? "Random shuffle"
                    : `Manual · then ${form.subsequentFormat}`,
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-ink-muted">{k}</dt>
                  <dd className="font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] text-ink-faint">
              Launching opens the room for{" "}
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
          <Button variant="secondary" className="w-full justify-center" onClick={() => setStep(0)}>
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
            <p className="text-sm text-ink-muted">Opening the room for {pool.name}…</p>
          </div>
        </div>
      )}
    </main>
  );
}

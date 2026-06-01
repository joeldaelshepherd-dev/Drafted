"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button, Card, Flag, Input, Label } from "@/components/ui";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { AuthCard } from "./AuthCard";
import { TeamPicker } from "./TeamPicker";
import { writeProfile } from "@/lib/profile/store";
import { suggestAvatars, suggestNicknames } from "@/lib/profile/suggestions";
import { getWorldCupTeam, flagUrlFor } from "@/lib/data/wc2026";
import type { AuthProvider, AvatarConfig, PlayerProfile } from "@/lib/profile/types";

const TITLES = [
  "Welcome to Drafted",
  "What's your name?",
  "Pick your identity",
  "Who do you support?",
  "You're all set",
];

function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [provider, setProvider] = useState<AuthProvider>("email");
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarConfig>({
    style: "jersey",
    color: "#22d38a",
    number: 10,
    teamId: null,
  });
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [nickOffset, setNickOffset] = useState(0);

  const nickSuggestions = useMemo(
    () => suggestNicknames({ firstName, lastName, supportedTeamIds: teamIds }),
    [firstName, lastName, teamIds],
  );
  const avatarSuggestions = useMemo(
    () => suggestAvatars({ firstName, supportedTeamIds: teamIds }),
    [firstName, teamIds],
  );
  const visibleNicks = useMemo(() => {
    if (nickSuggestions.length === 0) return [];
    return Array.from({ length: Math.min(4, nickSuggestions.length) }, (_, i) => {
      return nickSuggestions[(nickOffset + i) % nickSuggestions.length];
    });
  }, [nickSuggestions, nickOffset]);

  // Pre-fill a friendly nickname the first time the user reaches step 2.
  useEffect(() => {
    if (step === 2 && !nickname && visibleNicks[0]) setNickname(visibleNicks[0]);
  }, [step, nickname, visibleNicks]);

  const supportedTeams = teamIds
    .map((id) => getWorldCupTeam(id))
    .filter((t): t is NonNullable<ReturnType<typeof getWorldCupTeam>> => Boolean(t));

  const canAdvance =
    step === 1 ? firstName.trim().length > 0 : step === 2 ? nickname.trim().length > 0 : true;

  function finish() {
    const profile: PlayerProfile = {
      id: uid(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim() || firstName.trim() || "Player",
      email,
      authProvider: provider,
      avatar,
      supportedTeamIds: teamIds,
      createdAt: new Date().toISOString(),
    };
    writeProfile(profile);
    router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Progress */}
      <div className="mb-6 flex gap-1.5">
        {TITLES.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-brand" : "bg-white/10",
            )}
          />
        ))}
      </div>

      <h1 className="mb-1 text-2xl font-black text-ink">{TITLES[step]}</h1>
      <p className="mb-6 text-sm text-ink-muted">
        {step === 0 && "Sign in or create your account to start drafting."}
        {step === 1 && "We'll use this on your teams and leaderboards."}
        {step === 2 && "Your nickname and avatar are how the pool sees you."}
        {step === 3 && "Pick one or more national teams — it themes your suggestions."}
        {step === 4 && "Review your profile, then jump into your pools."}
      </p>

      <div className="flex flex-1 flex-col">
        {step === 0 && (
          <AuthCard
            onAuthed={(d) => {
              setProvider(d.provider);
              setEmail(d.email);
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="first">First name</Label>
              <Input
                id="first"
                autoFocus
                placeholder="Joel"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last">Last name</Label>
              <Input
                id="last"
                placeholder="Shepherd"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <ProfileAvatar config={avatar} name={`${firstName} ${lastName}`} size="lg" />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">Preview</p>
                <p className="truncate text-lg font-black text-ink">{nickname || "Your nickname"}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="nick">Nickname</Label>
              <Input
                id="nick"
                placeholder="Clinical Joel"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">
                  ✨ Suggestions
                </p>
                <button
                  type="button"
                  onClick={() => setNickOffset((o) => o + 4)}
                  className="text-xs font-bold text-brand hover:underline"
                >
                  ↻ More
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleNicks.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNickname(n)}
                    className={cn(
                      "pill transition",
                      nickname === n
                        ? "bg-brand text-bg"
                        : "bg-white/[0.04] text-ink-muted hover:text-ink",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">Avatar</p>
              <div className="grid grid-cols-4 gap-3">
                {avatarSuggestions.map((a, i) => {
                  const on =
                    a.style === avatar.style &&
                    a.color === avatar.color &&
                    a.number === avatar.number &&
                    a.teamId === avatar.teamId;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatar(a)}
                      className={cn(
                        "grid place-items-center rounded-2xl p-1 transition",
                        on ? "ring-2 ring-brand" : "ring-1 ring-white/10 hover:ring-white/25",
                      )}
                    >
                      <ProfileAvatar config={a} name={`${firstName} ${lastName}`} size="sm" />
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                AI-generated avatar art comes later — these are smart presets for now.
              </p>
            </div>
          </div>
        )}

        {step === 3 && <TeamPicker selected={teamIds} onChange={setTeamIds} />}

        {step === 4 && (
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <ProfileAvatar config={avatar} name={`${firstName} ${lastName}`} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-ink">{nickname}</p>
                <p className="truncate text-sm text-ink-muted">
                  {firstName} {lastName}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-sm">
              <span className="text-ink-faint">Sign-in</span>
              <span className="font-semibold text-ink">
                {provider === "google" ? "Google" : "Email"}
                {email ? ` · ${email}` : ""}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
                Supporting
              </p>
              {supportedTeams.length === 0 ? (
                <p className="text-sm text-ink-muted">No teams picked yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {supportedTeams.map((t) => (
                    <span key={t.id} className="pill flex items-center gap-2 bg-white/[0.04]">
                      <Flag url={flagUrlFor(t)} code={t.shortCode} size="sm" />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      {step > 0 && (
        <div className="sticky bottom-0 mt-6 flex gap-3 bg-gradient-to-t from-bg via-bg pb-2 pt-4">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </Button>
          {step < 4 ? (
            <Button
              className="flex-1 justify-center"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button className="flex-1 justify-center" onClick={finish}>
              Enter Drafted
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

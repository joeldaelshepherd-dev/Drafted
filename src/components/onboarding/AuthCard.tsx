"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button, Input, Label } from "@/components/ui";
import type { AuthProvider } from "@/lib/profile/types";

/** A 4-colour Google "G" mark, inlined so we don't ship an icon dependency. */
function GoogleGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export function AuthCard({
  onAuthed,
}: {
  onAuthed: (data: { email: string | null; provider: AuthProvider }) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "tap rounded-lg py-2.5 text-sm font-bold transition",
              mode === m ? "bg-brand text-bg" : "text-ink-muted hover:text-ink",
            )}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full justify-center gap-3"
        onClick={() => onAuthed({ email: email.trim() || "you@gmail.com", provider: "google" })}
      >
        <GoogleGlyph />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-ink-faint">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-semibold uppercase tracking-wide">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onAuthed({ email: email.trim() || null, provider: "email" });
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full justify-center">
          {mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs leading-relaxed text-ink-faint">
        Demo mode — no real account is created and your password isn&apos;t stored. Secure Google &amp;
        email sign-in arrives with the backend.
      </p>
    </div>
  );
}

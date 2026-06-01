"use client";

/**
 * Demo profile store — localStorage only.
 *
 * TODO(drafted): replace with Supabase Auth session + `profiles` table reads.
 * Keeping the API tiny (read/write/clear + a hook) means the swap touches only
 * this file. A custom `drafted:profile` event keeps multiple mounted components
 * in sync within the same tab; the native `storage` event covers other tabs.
 */
import { useCallback, useEffect, useState } from "react";
import type { PlayerProfile } from "./types";

const KEY = "drafted.profile.v1";
const EVENT = "drafted:profile";

export function readProfile(): PlayerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

export function writeProfile(profile: PlayerProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(EVENT));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useProfile() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(readProfile());
    setLoading(false);
    const sync = () => setProfile(readProfile());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((p: PlayerProfile) => {
    writeProfile(p);
    setProfile(p);
  }, []);

  const clear = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  return { profile, loading, save, clear };
}

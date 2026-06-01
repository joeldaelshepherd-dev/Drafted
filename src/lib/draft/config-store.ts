"use client";

/**
 * Demo draft-config store — localStorage only.
 *
 * Persists the admin's chosen DraftSettings per pool (keyed by poolId) so the
 * setup wizard's output actually drives the live draft. Mirrors the pool/profile
 * stores: read/write/seed + a hook, a `drafted:draftConfig` event for same-tab
 * sync and the native `storage` event for other tabs.
 *
 * TODO(drafted): replace with a Supabase `drafts` row (settings JSON) per pool.
 */
import { useCallback, useEffect, useState } from "react";
import type { DraftSettings } from "./types";

const KEY = "drafted.draftConfig.v1";
const EVENT = "drafted:draftConfig";

/** Sensible defaults the wizard opens with for a brand-new draft. */
export const DEFAULT_DRAFT_SETTINGS: DraftSettings = {
  style: "draft",
  budget: 200,
  marqueeCount: 8,
  format: "snake",
  pickSeconds: 60,
  allocationMode: "fixed",
  squadMode: "fixed",
  boardSize: 48,
  teamsPerUser: 4,
  orderMode: "random",
  subsequentFormat: "snake",
  bidSeconds: 20,
  bidExtendSeconds: 7,
  autoPick: true,
  draftChat: true,
  soundEffects: true,
  announcements: true,
  allowCoAdmins: true,
  postDraftTrading: false,
  predictionGame: true,
  pushNotifications: true,
};

type ConfigMap = Record<string, DraftSettings>;

function readMap(): ConfigMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConfigMap) : {};
  } catch {
    return {};
  }
}

function persist(map: ConfigMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EVENT));
}

export function readDraftSettings(poolId: string): DraftSettings | null {
  return readMap()[poolId] ?? null;
}

export function useDraftConfig(poolId: string) {
  const [settings, setSettings] = useState<DraftSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSettings(readDraftSettings(poolId));
    setLoading(false);
    const sync = () => setSettings(readDraftSettings(poolId));
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [poolId]);

  const saveSettings = useCallback(
    (next: DraftSettings) => {
      const map = readMap();
      map[poolId] = next;
      persist(map);
      setSettings(next);
    },
    [poolId],
  );

  return { settings, loading, saveSettings };
}

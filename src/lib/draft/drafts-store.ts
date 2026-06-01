"use client";

/**
 * Draft registry — localStorage only.
 *
 * A pool can run several drafts/tournaments at once, so we key by a per-draft
 * `draftId` rather than by `poolId` (the old `config-store.ts` shape allowed one
 * config per pool). Each DraftRecord bundles the chosen settings with a lifecycle
 * status so the pool page can list, enter, edit, and cancel drafts independently.
 *
 * Mirrors the other stores: read/write/seed + hooks, a `drafted:drafts` event for
 * same-tab sync and the native `storage` event for other tabs. A one-time soft
 * migration folds any legacy single-per-pool config into a DraftRecord so existing
 * setups survive the upgrade.
 *
 * TODO(drafted): replace with a Supabase `drafts` row (settings JSON) per pool.
 */
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_DRAFT_SETTINGS } from "./config-store";
import type { DraftSettings } from "./types";

const KEY = "drafted.drafts.v2";
const EVENT = "drafted:drafts";
const LEGACY_KEY = "drafted.draftConfig.v1";
const MIGRATED_FLAG = "drafted.drafts.migrated";

export type DraftRecordStatus = "configuring" | "in_progress" | "complete" | "cancelled";

export interface DraftRecord {
  id: string;
  poolId: string;
  name: string;
  settings: DraftSettings;
  status: DraftRecordStatus;
  createdAt: string;
}

type DraftsMap = Record<string, DraftRecord>;

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function rawRead(): DraftsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DraftsMap) : {};
  } catch {
    return {};
  }
}

/**
 * One-time fold of the legacy `drafted.draftConfig.v1` (Record<poolId, settings>)
 * into the registry. In-progress draft *state* was always ephemeral, so only the
 * settings carry over — each becomes a fresh "configuring" record for its pool.
 */
function migrateLegacy(map: DraftsMap): DraftsMap {
  if (typeof window === "undefined") return map;
  if (window.localStorage.getItem(MIGRATED_FLAG)) return map;
  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as Record<string, DraftSettings>;
      for (const [poolId, settings] of Object.entries(legacy)) {
        const id = newId();
        map[id] = {
          id,
          poolId,
          name: "Draft 1",
          settings: { ...DEFAULT_DRAFT_SETTINGS, ...settings },
          status: "configuring",
          createdAt: new Date().toISOString(),
        };
      }
      window.localStorage.setItem(KEY, JSON.stringify(map));
    }
    window.localStorage.setItem(MIGRATED_FLAG, "1");
  } catch {
    // best-effort migration; ignore parse/storage failures.
  }
  return map;
}

function readMap(): DraftsMap {
  return migrateLegacy(rawRead());
}

function persist(map: DraftsMap): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EVENT));
}

// ---- Reads ------------------------------------------------------------------

export function listDraftsForPool(poolId: string): DraftRecord[] {
  return Object.values(readMap())
    .filter((d) => d.poolId === poolId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getDraft(draftId: string): DraftRecord | null {
  return readMap()[draftId] ?? null;
}

/** The most-advanced draft for a pool, for deriving the pool's summary status. */
export function newestDraftForPool(poolId: string): DraftRecord | null {
  const list = listDraftsForPool(poolId);
  return list.length ? list[list.length - 1] : null;
}

// ---- Writes (call from handlers/effects only — SSR-safe) --------------------

export function createDraftRecord(poolId: string, name?: string): DraftRecord {
  const map = readMap();
  const id = newId();
  const count = Object.values(map).filter((d) => d.poolId === poolId).length;
  const record: DraftRecord = {
    id,
    poolId,
    name: name?.trim() || `Draft ${count + 1}`,
    settings: { ...DEFAULT_DRAFT_SETTINGS },
    status: "configuring",
    createdAt: new Date().toISOString(),
  };
  map[id] = record;
  persist(map);
  return record;
}

export function saveDraftSettings(draftId: string, settings: DraftSettings): void {
  const map = readMap();
  const existing = map[draftId];
  if (!existing) return;
  map[draftId] = { ...existing, settings };
  persist(map);
}

export function setDraftStatus(draftId: string, status: DraftRecordStatus): void {
  const map = readMap();
  const existing = map[draftId];
  if (!existing) return;
  map[draftId] = { ...existing, status };
  persist(map);
}

export function renameDraftRecord(draftId: string, name: string): void {
  const map = readMap();
  const existing = map[draftId];
  if (!existing) return;
  map[draftId] = { ...existing, name: name.trim() || existing.name };
  persist(map);
}

export function cancelDraftRecord(draftId: string): void {
  setDraftStatus(draftId, "cancelled");
}

export function deleteDraftRecord(draftId: string): void {
  const map = readMap();
  if (!map[draftId]) return;
  delete map[draftId];
  persist(map);
}

// ---- Hooks ------------------------------------------------------------------

export function useDraftsForPool(poolId: string) {
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setDrafts(listDraftsForPool(poolId));
    sync();
    setLoading(false);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [poolId]);

  return { drafts, loading };
}

export function useDraftRecord(draftId: string) {
  const [draft, setDraft] = useState<DraftRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => setDraft(getDraft(draftId));
    sync();
    setLoading(false);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [draftId]);

  return { draft, loading };
}

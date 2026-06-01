"use client";

/**
 * Demo pool store — localStorage only.
 *
 * TODO(drafted): replace with Supabase `pools` + `pool_members` reads/writes.
 * Mirrors the profile store: a tiny read/write/seed API plus a hook, with a
 * `drafted:pools` event for same-tab sync and the native `storage` event for
 * other tabs. On first run it seeds the "Shepherd Family Syndicate" demo pool so
 * the dashboard never renders empty.
 */
import { useCallback, useEffect, useState } from "react";
import type { Pool, PoolMember } from "./types";

const KEY = "drafted.pools.v1";
const EVENT = "drafted:pools";

export const DEMO_POOL_ID = "20000000-0000-0000-0000-000000000001";
const DEMO_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

const DEMO_MEMBERS: PoolMember[] = [
  { id: "00000000-0000-0000-0000-000000000001", name: "Joel Shepherd" },
  { id: "00000000-0000-0000-0000-000000000002", name: "Kelly Shepherd" },
  { id: "00000000-0000-0000-0000-000000000003", name: "Hayley Shepherd" },
  { id: "00000000-0000-0000-0000-000000000004", name: "Mike Shepherd" },
  { id: "00000000-0000-0000-0000-000000000005", name: "Luke Shepherd" },
  { id: "00000000-0000-0000-0000-000000000006", name: "Murray Shepherd" },
  { id: "00000000-0000-0000-0000-000000000007", name: "Sarah Shepherd" },
  { id: "00000000-0000-0000-0000-000000000008", name: "Delys Shepherd" },
  { id: "00000000-0000-0000-0000-000000000009", name: "Bridget Shepherd" },
];

/** Deterministic so first render is SSR-stable (no random at seed time). */
function seedPools(): Pool[] {
  return [
    {
      id: DEMO_POOL_ID,
      name: "Shepherd Family Syndicate",
      tournamentName: "FIFA World Cup 2026",
      inviteCode: "SHEP26",
      adminId: DEMO_ADMIN_ID,
      isAdmin: true,
      members: DEMO_MEMBERS,
      draftStatus: "not_started",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];
}

function uid(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `pool_${Date.now()}_${Math.floor(Math.random() * 1e6)}`
  );
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export function readPools(): Pool[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Pool[]) : [];
  } catch {
    return [];
  }
}

function persist(pools: Pool[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(pools));
  window.dispatchEvent(new Event(EVENT));
}

/** Ensures the demo pool exists on first run; returns the current set. */
function ensureSeed(): Pool[] {
  if (typeof window === "undefined") return [];
  if (window.localStorage.getItem(KEY) == null) {
    const seeded = seedPools();
    persist(seeded);
    return seeded;
  }
  return readPools();
}

export function usePools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPools(ensureSeed());
    setLoading(false);
    const sync = () => setPools(readPools());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const createPool = useCallback(
    (input: { name: string; adminId: string; adminName: string }) => {
      const pool: Pool = {
        id: uid(),
        name: input.name.trim() || "New Pool",
        tournamentName: "FIFA World Cup 2026",
        inviteCode: randomCode(),
        adminId: input.adminId,
        isAdmin: true,
        members: [{ id: input.adminId, name: input.adminName }],
        draftStatus: "not_started",
        createdAt: new Date().toISOString(),
      };
      const next = [...readPools(), pool];
      persist(next);
      setPools(next);
      return pool;
    },
    [],
  );

  const joinByCode = useCallback(
    (code: string, member: PoolMember): Pool | null => {
      const target = code.trim().toUpperCase();
      const current = readPools();
      const pool = current.find((p) => p.inviteCode.toUpperCase() === target);
      if (!pool) return null;
      if (!pool.members.some((m) => m.id === member.id)) {
        pool.members = [...pool.members, member];
        persist(current);
        setPools(current);
      }
      return pool;
    },
    [],
  );

  return { pools, loading, createPool, joinByCode };
}

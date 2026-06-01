# ⚽ Drafted

A premium, invite-only **multi-pool fantasy football tournament** platform. Draft national teams,
make weekly lock-in predictions, ride the live leaderboard, and talk trash — built for families,
friend groups, and office pools.

Built **tournament-agnostic** from day one. FIFA World Cup 2026 ships first; the same engine powers
Euros, AFCON, Champions League, Rugby World Cup, and prediction-only pools later.

> **Status:** broad scaffold. The data model, tournament/scoring engine, football provider layer,
> design system, and all primary screens are in place. Many screens render against seed data and are
> ready to be wired to live Supabase Realtime. See **What's stubbed** below.

---

## Stack

| Layer      | Tech                                                         |
| ---------- | ------------------------------------------------------------ |
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Backend    | Supabase (Postgres + Auth + Realtime + Row Level Security)   |
| Live data  | API-Football (primary), behind a provider abstraction        |
| Hosting    | Vercel (Cron-driven sync job included)                       |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local      # fill in Supabase + API-Football keys

# 3. Database (requires the Supabase CLI + a project)
supabase db push                # applies supabase/migrations/*
npm run db:seed                 # loads the "Shepherd Family Syndicate" demo pool

# 4. Run
npm run dev                     # http://localhost:3000
```

> No internet was available in the environment that generated this scaffold, so dependencies were
> **not** installed and the app was **not** run here. `npm install` then `npm run dev` locally.

---

## Project layout

```
drafted/
├─ supabase/
│  ├─ migrations/
│  │  ├─ 0001_init.sql          # all ~20 tables + enums + indexes + triggers
│  │  └─ 0002_rls.sql           # row level security policies (pool isolation)
│  └─ seed/seed.sql             # Shepherd Family Syndicate demo data
├─ scripts/sync-football.ts     # standalone sync runner (cron calls the API route)
└─ src/
   ├─ app/                      # routes (dashboard, pools, draft, predictions, …)
   ├─ components/               # ui primitives + feature components
   ├─ lib/
   │  ├─ supabase/              # browser + server clients
   │  ├─ tournament/            # ⭐ reusable engine + scoring (pure, unit-testable)
   │  └─ football/              # ⭐ provider abstraction + API-Football adapter + mock
   └─ types/database.ts         # generated-style DB types
```

The two starred folders are the heart of the product and have no UI dependencies — they're pure
TypeScript and the easiest place to extend with new tournaments or scoring rules.

---

## The tournament engine

`src/lib/tournament/` is deliberately decoupled from FIFA. A tournament is described by config
(group stage rules, knockout rounds, progression bonuses) and the engine computes standings and
points from fixtures + results. To add the Euros you add a config object — not a new code path.

- `scoring.ts` — team points (group W/D + progression bonuses, optional knockout multiplier) and
  prediction points (round-scaled, admin-configurable).
- `engine.ts` — standings computation, live projected standings, knockout progression.
- `config.ts` — `WORLD_CUP_2026` config; template for future tournaments.

Default scoring (all admin-overridable per pool):

| Team event        | Pts | Prediction round | Pts |
| ----------------- | --- | ---------------- | --- |
| Group win         | 3   | Group stage      | 2   |
| Group draw        | 1   | Round of 32      | 3   |
| Reach R32         | 2   | Round of 16      | 5   |
| Reach R16         | 3   | Quarter-final    | 8   |
| Reach QF          | 5   | Semi-final       | 12  |
| Reach SF          | 8   | Final            | 20  |
| Reach Final       | 12  |                  |     |
| Win tournament    | 20  |                  |     |

---

## Live data

`src/lib/football/` hides the provider behind a `FootballProvider` interface.

- `api-football.ts` — primary adapter (set `API_FOOTBALL_KEY`).
- `mock.ts` — offline provider driven by seed data, so the app runs with **no key**.
- `cache.ts` / rate-limit guard — short TTL cache to stay under provider quotas.

Syncing: `vercel.json` registers a Cron hitting `/api/sync/football` every 2 minutes; that route
pulls fixtures/results, writes to Postgres, and Realtime fans changes out to clients. Admins can
manually override any score from the pool admin panel.

---

## What's stubbed (next steps)

- Realtime wiring: screens read seed data; subscribe to Supabase channels for true live movement.
- Auth screens exist; magic-link callback + session middleware need your Supabase project keys.
- Draft room has the board, ticker, and timer UI; the realtime pick broadcast needs a channel.
- Notifications, chat reactions, and story generation have schema + UI; generators are sketched.

Each is marked with `// TODO(drafted):` in code.

---

## Deploy

Push to a Git repo, import into Vercel, add the env vars from `.env.example`, and deploy. The Cron
job starts automatically. Run the migrations and seed against your Supabase project first.

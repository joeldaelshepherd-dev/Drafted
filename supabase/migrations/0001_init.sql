-- ════════════════════════════════════════════════════════════════════════
-- Drafted — initial schema
-- Tournament-agnostic core. FIFA World Cup 2026 is just the first `tournament`.
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────
create type pool_role        as enum ('owner', 'admin', 'member');
create type tournament_stage as enum (
  'group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final'
);
create type fixture_status   as enum ('scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled');
create type prediction_type  as enum (
  'match_winner', 'exact_score', 'over_under', 'both_teams_to_score', 'qualification'
);
create type draft_status     as enum ('pending', 'live', 'paused', 'complete');
create type notification_kind as enum (
  'draft_reminder', 'prediction_reminder', 'score_event', 'rivalry_alert',
  'team_plays_soon', 'leaderboard_move', 'upset_alert', 'announcement'
);

-- ── Users (profile mirror of auth.users) ────────────────────────────────
create table users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text unique not null,
  nickname        text not null,
  bio             text,
  avatar_url      text,
  favorite_team_id uuid,                 -- fk added after teams exists
  reputation      integer not null default 1000,   -- long-term dynasty score
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── Tournaments (the reusable engine's anchor) ──────────────────────────
create table tournaments (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,             -- 'fifa-world-cup-2026'
  name        text not null,
  sport       text not null default 'football',
  season      text,                             -- '2026'
  starts_at   timestamptz,
  ends_at     timestamptz,
  -- Engine config: group rules, knockout rounds, progression bonuses.
  config      jsonb not null default '{}'::jsonb,
  provider_ref jsonb,                           -- { league_id, season } for the data adapter
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Teams (national teams, clubs — provider-mapped) ─────────────────────
create table teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name          text not null,
  short_code    text,                           -- 'BRA'
  flag_url      text,
  group_label   text,                           -- 'A'..'L'
  seed          integer,
  provider_id   text,                           -- id in the football provider
  created_at    timestamptz not null default now(),
  unique (tournament_id, name)
);

alter table users
  add constraint users_favorite_team_fk
  foreign key (favorite_team_id) references teams(id) on delete set null;

-- ── Fixtures (matches) ──────────────────────────────────────────────────
create table fixtures (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  stage         tournament_stage not null,
  matchweek     integer,
  kickoff_at    timestamptz not null,
  status        fixture_status not null default 'scheduled',
  home_team_id  uuid references teams(id) on delete set null,
  away_team_id  uuid references teams(id) on delete set null,
  home_score    integer,
  away_score    integer,
  minute        integer,                         -- live clock
  provider_id   text,
  -- goalscorers, cards, etc. as provider returns them
  stats         jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index fixtures_tournament_kickoff_idx on fixtures (tournament_id, kickoff_at);
create index fixtures_status_idx on fixtures (status);

-- ── Pools (private leagues) ─────────────────────────────────────────────
create table pools (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references tournaments(id) on delete restrict,
  owner_id         uuid not null references users(id) on delete restrict,
  name             text not null,
  image_url        text,
  banner_url       text,
  is_public        boolean not null default false,
  max_members      integer not null default 20,
  teams_per_user   integer not null default 4,
  draft_at         timestamptz,
  draft_status     draft_status not null default 'pending',
  -- Per-pool overrides for scoring + prediction points + toggles.
  scoring_config   jsonb not null default '{}'::jsonb,
  prediction_config jsonb not null default '{}'::jsonb,
  knockout_multiplier boolean not null default false,
  prize_description text,
  created_at       timestamptz not null default now()
);
create index pools_tournament_idx on pools (tournament_id);
create index pools_owner_idx on pools (owner_id);

-- ── Pool membership ─────────────────────────────────────────────────────
create table pool_members (
  id         uuid primary key default gen_random_uuid(),
  pool_id    uuid not null references pools(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       pool_role not null default 'member',
  draft_position integer,                        -- snake-draft slot
  joined_at  timestamptz not null default now(),
  unique (pool_id, user_id)
);
create index pool_members_user_idx on pool_members (user_id);

-- ── Invite codes ────────────────────────────────────────────────────────
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  code        text unique not null,
  created_by  uuid references users(id) on delete set null,
  max_uses    integer,                            -- null = unlimited
  uses        integer not null default 0,
  expires_at  timestamptz,                        -- null = never
  created_at  timestamptz not null default now()
);

-- ── Drafted teams (a member's roster within one pool) ───────────────────
create table drafted_teams (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  team_id     uuid not null references teams(id) on delete cascade,
  pick_number integer not null,                   -- overall snake order
  picked_at   timestamptz not null default now(),
  unique (pool_id, team_id),                       -- a team is drafted once per pool
  unique (pool_id, pick_number)
);
create index drafted_teams_pool_user_idx on drafted_teams (pool_id, user_id);

-- ── Weekly Lock-In Predictions ──────────────────────────────────────────
create table weekly_predictions (
  id            uuid primary key default gen_random_uuid(),
  pool_id       uuid not null references pools(id) on delete cascade,
  fixture_id    uuid references fixtures(id) on delete set null,
  matchweek     integer not null,
  stage         tournament_stage not null,
  type          prediction_type not null,
  prompt        text not null,                     -- "Who wins Spain vs Japan?"
  locks_at      timestamptz not null,
  correct_option_id uuid,                          -- resolved after the match
  created_by    uuid references users(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index weekly_predictions_pool_idx on weekly_predictions (pool_id, matchweek);

create table prediction_options (
  id            uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references weekly_predictions(id) on delete cascade,
  label         text not null,                     -- "Spain", "Draw", "Over 2.5"
  value         text not null,                     -- machine value
  sort_order    integer not null default 0
);

create table user_prediction_entries (
  id            uuid primary key default gen_random_uuid(),
  prediction_id uuid not null references weekly_predictions(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  option_id     uuid not null references prediction_options(id) on delete cascade,
  is_correct    boolean,                            -- null until resolved
  points_awarded integer not null default 0,
  submitted_at  timestamptz not null default now(),
  unique (prediction_id, user_id)
);

-- ── Scores (atomic point events — full audit trail) ─────────────────────
create table scores (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  fixture_id  uuid references fixtures(id) on delete set null,
  source      text not null,                        -- 'team_result' | 'progression' | 'prediction'
  team_id     uuid references teams(id) on delete set null,
  points      integer not null,
  reason      text,                                 -- "Spain win (group)"
  created_at  timestamptz not null default now()
);
create index scores_pool_user_idx on scores (pool_id, user_id);

-- ── Standings (materialized leaderboard snapshot) ───────────────────────
create table standings (
  id            uuid primary key default gen_random_uuid(),
  pool_id       uuid not null references pools(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  total_points  integer not null default 0,
  prediction_points integer not null default 0,
  team_points   integer not null default 0,
  rank          integer,
  previous_rank integer,
  updated_at    timestamptz not null default now(),
  unique (pool_id, user_id)
);

-- ── Achievements / badges ───────────────────────────────────────────────
create table achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  pool_id     uuid references pools(id) on delete cascade,   -- null = global
  code        text not null,                         -- 'oracle','perfect_week',...
  label       text not null,
  description text,
  awarded_at  timestamptz not null default now(),
  unique (user_id, pool_id, code)
);

-- ── Rivalries ───────────────────────────────────────────────────────────
create table rivalries (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  user_a      uuid not null references users(id) on delete cascade,
  user_b      uuid not null references users(id) on delete cascade,
  name        text not null,                         -- "Sibling Supremacy"
  stats       jsonb not null default '{}'::jsonb,    -- h2h, stolen picks, point gap
  intensity   integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (pool_id, user_a, user_b)
);

-- ── Stories (auto-generated vertical cards) ─────────────────────────────
create table stories (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  subject_user uuid references users(id) on delete set null,
  kind        text not null,                         -- 'rank_jump','heartbreak','clutch'
  headline    text not null,
  body        text,
  payload     jsonb not null default '{}'::jsonb,    -- flags, deltas for the card
  created_at  timestamptz not null default now()
);
create index stories_pool_idx on stories (pool_id, created_at desc);

-- ── Announcements ───────────────────────────────────────────────────────
create table announcements (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  author_id   uuid references users(id) on delete set null,
  title       text not null,
  body        text not null,
  is_poll     boolean not null default false,
  poll_options jsonb,                                -- [{label, votes}]
  created_at  timestamptz not null default now()
);

-- ── Chat ────────────────────────────────────────────────────────────────
create table chat_messages (
  id          uuid primary key default gen_random_uuid(),
  pool_id     uuid not null references pools(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  body        text not null,
  reply_to    uuid references chat_messages(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index chat_messages_pool_idx on chat_messages (pool_id, created_at desc);

create table reactions (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references chat_messages(id) on delete cascade,
  user_id     uuid not null references users(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

-- ── Notifications ───────────────────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  pool_id     uuid references pools(id) on delete cascade,
  kind        notification_kind not null,
  title       text not null,
  body        text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_user_unread_idx on notifications (user_id, is_read);

-- ── updated_at trigger ──────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at      before update on users    for each row execute function set_updated_at();
create trigger fixtures_updated_at   before update on fixtures for each row execute function set_updated_at();
create trigger standings_updated_at  before update on standings for each row execute function set_updated_at();

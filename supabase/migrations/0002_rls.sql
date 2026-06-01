-- ════════════════════════════════════════════════════════════════════════
-- Drafted — Row Level Security
-- Principle: a user can only read/write data inside pools they belong to.
-- Tournament/teams/fixtures are public reference data (read-only to clients).
-- ════════════════════════════════════════════════════════════════════════

-- Helper: is the current user a member of the given pool?
create or replace function is_pool_member(p uuid) returns boolean as $$
  select exists (
    select 1 from pool_members
    where pool_id = p and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Helper: is the current user owner/admin of the given pool?
create or replace function is_pool_admin(p uuid) returns boolean as $$
  select exists (
    select 1 from pool_members
    where pool_id = p and user_id = auth.uid() and role in ('owner','admin')
  );
$$ language sql security definer stable;

-- ── Enable RLS everywhere ───────────────────────────────────────────────
alter table users                  enable row level security;
alter table tournaments            enable row level security;
alter table teams                  enable row level security;
alter table fixtures               enable row level security;
alter table pools                  enable row level security;
alter table pool_members           enable row level security;
alter table invite_codes           enable row level security;
alter table drafted_teams          enable row level security;
alter table weekly_predictions     enable row level security;
alter table prediction_options     enable row level security;
alter table user_prediction_entries enable row level security;
alter table scores                 enable row level security;
alter table standings              enable row level security;
alter table achievements           enable row level security;
alter table rivalries              enable row level security;
alter table stories                enable row level security;
alter table announcements          enable row level security;
alter table chat_messages          enable row level security;
alter table reactions              enable row level security;
alter table notifications          enable row level security;

-- ── Public reference data (read-only) ───────────────────────────────────
create policy "tournaments readable" on tournaments for select using (true);
create policy "teams readable"        on teams       for select using (true);
create policy "fixtures readable"     on fixtures    for select using (true);

-- ── Users ───────────────────────────────────────────────────────────────
-- Profiles are readable (manager cards), but a user edits only their own.
create policy "users readable"       on users for select using (true);
create policy "users update self"    on users for update using (id = auth.uid());
create policy "users insert self"    on users for insert with check (id = auth.uid());

-- ── Pools ───────────────────────────────────────────────────────────────
create policy "pools select"
  on pools for select
  using (is_public or is_pool_member(id));
create policy "pools insert (owner)"
  on pools for insert with check (owner_id = auth.uid());
create policy "pools update (admin)"
  on pools for update using (is_pool_admin(id));

-- ── Pool members ────────────────────────────────────────────────────────
create policy "members select (same pool)"
  on pool_members for select using (is_pool_member(pool_id));
-- Joining: a user inserts their own membership row (invite is validated app-side).
create policy "members insert self"
  on pool_members for insert with check (user_id = auth.uid());
create policy "members manage (admin)"
  on pool_members for update using (is_pool_admin(pool_id));
create policy "members leave/remove"
  on pool_members for delete using (user_id = auth.uid() or is_pool_admin(pool_id));

-- ── Invite codes ────────────────────────────────────────────────────────
create policy "invites select (member)"  on invite_codes for select using (is_pool_member(pool_id));
create policy "invites manage (admin)"    on invite_codes for all    using (is_pool_admin(pool_id)) with check (is_pool_admin(pool_id));

-- ── Generic pool-scoped tables (member read, see notes for writes) ──────
-- Pattern macro applied manually per table below.

-- drafted_teams
create policy "drafts select" on drafted_teams for select using (is_pool_member(pool_id));
create policy "drafts insert self" on drafted_teams for insert with check (user_id = auth.uid() and is_pool_member(pool_id));

-- weekly_predictions (admin creates the featured prediction)
create policy "predictions select" on weekly_predictions for select using (is_pool_member(pool_id));
create policy "predictions manage (admin)" on weekly_predictions for all using (is_pool_admin(pool_id)) with check (is_pool_admin(pool_id));

-- prediction_options (readable to members of the parent prediction's pool)
create policy "options select" on prediction_options for select
  using (exists (select 1 from weekly_predictions wp where wp.id = prediction_id and is_pool_member(wp.pool_id)));
create policy "options manage (admin)" on prediction_options for all
  using (exists (select 1 from weekly_predictions wp where wp.id = prediction_id and is_pool_admin(wp.pool_id)))
  with check (exists (select 1 from weekly_predictions wp where wp.id = prediction_id and is_pool_admin(wp.pool_id)));

-- user_prediction_entries (you submit your own; everyone in pool reads post-lock distribution)
create policy "entries select (member)" on user_prediction_entries for select
  using (exists (select 1 from weekly_predictions wp where wp.id = prediction_id and is_pool_member(wp.pool_id)));
create policy "entries insert self" on user_prediction_entries for insert with check (user_id = auth.uid());
create policy "entries update self" on user_prediction_entries for update using (user_id = auth.uid());

-- scores / standings (server-written via service role; members read)
create policy "scores select" on scores for select using (is_pool_member(pool_id));
create policy "standings select" on standings for select using (is_pool_member(pool_id));

-- achievements (global or pool-scoped; readable)
create policy "achievements select" on achievements for select
  using (pool_id is null or is_pool_member(pool_id));

-- rivalries
create policy "rivalries select" on rivalries for select using (is_pool_member(pool_id));

-- stories
create policy "stories select" on stories for select using (is_pool_member(pool_id));

-- announcements (member read, admin write)
create policy "announcements select" on announcements for select using (is_pool_member(pool_id));
create policy "announcements manage (admin)" on announcements for all using (is_pool_admin(pool_id)) with check (is_pool_admin(pool_id));

-- chat
create policy "chat select" on chat_messages for select using (is_pool_member(pool_id));
create policy "chat insert self" on chat_messages for insert with check (user_id = auth.uid() and is_pool_member(pool_id));
create policy "chat delete self/admin" on chat_messages for delete using (user_id = auth.uid() or is_pool_admin(pool_id));

-- reactions
create policy "reactions select" on reactions for select
  using (exists (select 1 from chat_messages m where m.id = message_id and is_pool_member(m.pool_id)));
create policy "reactions write self" on reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications (private to the user)
create policy "notifications own" on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- NOTE(drafted): scores/standings are written by the sync job + scoring engine
-- using the service-role key, which bypasses RLS. Clients never write them directly.

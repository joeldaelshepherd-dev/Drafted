-- ════════════════════════════════════════════════════════════════════════
-- Drafted — demo seed: "Shepherd Family Syndicate"
-- Run after migrations:  npm run db:seed   (or psql -f this file)
--
-- NOTE: auth.users rows below use placeholder credentials so FKs resolve in a
-- fresh local Supabase. In production, create real users via magic-link auth
-- and only seed the public.* tables. Re-running is safe (ON CONFLICT guards).
-- ════════════════════════════════════════════════════════════════════════

begin;

-- ── Auth users (local/dev only) ─────────────────────────────────────────
insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','authenticated','authenticated','joel@drafted.app',   crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000002','authenticated','authenticated','kelly@drafted.app',  crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000003','authenticated','authenticated','hayley@drafted.app', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000004','authenticated','authenticated','mike@drafted.app',   crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000005','authenticated','authenticated','luke@drafted.app',   crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000006','authenticated','authenticated','murray@drafted.app', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000007','authenticated','authenticated','sarah@drafted.app',  crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000008','authenticated','authenticated','delys@drafted.app',  crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}'),
  ('00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000009','authenticated','authenticated','bridget@drafted.app',crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}')
on conflict (id) do nothing;

-- ── Profiles (manager personalities) ────────────────────────────────────
insert into users (id, email, nickname, bio, reputation) values
  ('00000000-0000-0000-0000-000000000001','joel@drafted.app',   'The Commissioner', 'Runs the syndicate with an iron spreadsheet. Talks a big game.', 1180),
  ('00000000-0000-0000-0000-000000000002','kelly@drafted.app',  'The Oracle',       'Quietly correct. Never gloats — the standings do it for her.', 1320),
  ('00000000-0000-0000-0000-000000000003','hayley@drafted.app', 'Chaos Merchant',   'Picks the upset every single time. Sometimes it works.', 1090),
  ('00000000-0000-0000-0000-000000000004','mike@drafted.app',   'Tactical Fraud',   'Has opinions about formations he cannot name.', 1015),
  ('00000000-0000-0000-0000-000000000005','luke@drafted.app',   'Ice Veins',        'Submits at the deadline, every time, on purpose.', 1145),
  ('00000000-0000-0000-0000-000000000006','murray@drafted.app', 'The Survivor',     'Somehow still in contention. Nobody knows how.', 1070),
  ('00000000-0000-0000-0000-000000000007','sarah@drafted.app',  'Clutch',           'Cold in the group stage, lethal in the knockouts.', 1205),
  ('00000000-0000-0000-0000-000000000008','delys@drafted.app',  'The Matriarch',    'Drafts on vibes and loyalty. Beats you anyway.', 1110),
  ('00000000-0000-0000-0000-000000000009','bridget@drafted.app','Upset Queen',      'Lives for the late winner that ruins everyone.', 1060)
on conflict (id) do nothing;

-- ── Tournament: FIFA World Cup 2026 ─────────────────────────────────────
insert into tournaments (id, slug, name, season, starts_at, ends_at, config, provider_ref)
values (
  '10000000-0000-0000-0000-000000000001',
  'fifa-world-cup-2026',
  'FIFA World Cup 2026',
  '2026',
  '2026-06-11T00:00:00Z',
  '2026-07-19T00:00:00Z',
  '{
     "groupStage": { "win": 3, "draw": 1, "loss": 0 },
     "progression": { "round_of_32": 2, "round_of_16": 3, "quarter_final": 5, "semi_final": 8, "final": 12, "winner": 20 },
     "prediction": { "group": 2, "round_of_32": 3, "round_of_16": 5, "quarter_final": 8, "semi_final": 12, "final": 20 },
     "knockoutMultiplier": false,
     "groups": ["A","B","C","D","E","F","G","H","I","J","K","L"]
   }'::jsonb,
  '{ "provider": "api-football", "league_id": 1, "season": 2026 }'::jsonb
) on conflict (id) do nothing;

-- ── Teams (48 — 2026 expanded format, groups A–L) ───────────────────────
insert into teams (tournament_id, name, short_code, group_label, flag_url) values
  ('10000000-0000-0000-0000-000000000001','Mexico','MEX','A','https://flagcdn.com/mx.svg'),
  ('10000000-0000-0000-0000-000000000001','Croatia','CRO','A','https://flagcdn.com/hr.svg'),
  ('10000000-0000-0000-0000-000000000001','Cameroon','CMR','A','https://flagcdn.com/cm.svg'),
  ('10000000-0000-0000-0000-000000000001','Canada','CAN','A','https://flagcdn.com/ca.svg'),
  ('10000000-0000-0000-0000-000000000001','United States','USA','B','https://flagcdn.com/us.svg'),
  ('10000000-0000-0000-0000-000000000001','Wales','WAL','B','https://flagcdn.com/gb-wls.svg'),
  ('10000000-0000-0000-0000-000000000001','Ecuador','ECU','B','https://flagcdn.com/ec.svg'),
  ('10000000-0000-0000-0000-000000000001','Senegal','SEN','B','https://flagcdn.com/sn.svg'),
  ('10000000-0000-0000-0000-000000000001','Argentina','ARG','C','https://flagcdn.com/ar.svg'),
  ('10000000-0000-0000-0000-000000000001','Saudi Arabia','KSA','C','https://flagcdn.com/sa.svg'),
  ('10000000-0000-0000-0000-000000000001','Poland','POL','C','https://flagcdn.com/pl.svg'),
  ('10000000-0000-0000-0000-000000000001','Australia','AUS','C','https://flagcdn.com/au.svg'),
  ('10000000-0000-0000-0000-000000000001','France','FRA','D','https://flagcdn.com/fr.svg'),
  ('10000000-0000-0000-0000-000000000001','Denmark','DEN','D','https://flagcdn.com/dk.svg'),
  ('10000000-0000-0000-0000-000000000001','Tunisia','TUN','D','https://flagcdn.com/tn.svg'),
  ('10000000-0000-0000-0000-000000000001','Peru','PER','D','https://flagcdn.com/pe.svg'),
  ('10000000-0000-0000-0000-000000000001','Spain','ESP','E','https://flagcdn.com/es.svg'),
  ('10000000-0000-0000-0000-000000000001','Germany','GER','E','https://flagcdn.com/de.svg'),
  ('10000000-0000-0000-0000-000000000001','Japan','JPN','E','https://flagcdn.com/jp.svg'),
  ('10000000-0000-0000-0000-000000000001','Morocco','MAR','E','https://flagcdn.com/ma.svg'),
  ('10000000-0000-0000-0000-000000000001','Belgium','BEL','F','https://flagcdn.com/be.svg'),
  ('10000000-0000-0000-0000-000000000001','Serbia','SRB','F','https://flagcdn.com/rs.svg'),
  ('10000000-0000-0000-0000-000000000001','Switzerland','SUI','F','https://flagcdn.com/ch.svg'),
  ('10000000-0000-0000-0000-000000000001','Ghana','GHA','F','https://flagcdn.com/gh.svg'),
  ('10000000-0000-0000-0000-000000000001','Brazil','BRA','G','https://flagcdn.com/br.svg'),
  ('10000000-0000-0000-0000-000000000001','Portugal','POR','G','https://flagcdn.com/pt.svg'),
  ('10000000-0000-0000-0000-000000000001','Uruguay','URU','G','https://flagcdn.com/uy.svg'),
  ('10000000-0000-0000-0000-000000000001','South Korea','KOR','G','https://flagcdn.com/kr.svg'),
  ('10000000-0000-0000-0000-000000000001','England','ENG','H','https://flagcdn.com/gb-eng.svg'),
  ('10000000-0000-0000-0000-000000000001','Netherlands','NED','H','https://flagcdn.com/nl.svg'),
  ('10000000-0000-0000-0000-000000000001','Iran','IRN','H','https://flagcdn.com/ir.svg'),
  ('10000000-0000-0000-0000-000000000001','Nigeria','NGA','H','https://flagcdn.com/ng.svg'),
  ('10000000-0000-0000-0000-000000000001','Italy','ITA','I','https://flagcdn.com/it.svg'),
  ('10000000-0000-0000-0000-000000000001','Colombia','COL','I','https://flagcdn.com/co.svg'),
  ('10000000-0000-0000-0000-000000000001','Egypt','EGY','I','https://flagcdn.com/eg.svg'),
  ('10000000-0000-0000-0000-000000000001','Qatar','QAT','I','https://flagcdn.com/qa.svg'),
  ('10000000-0000-0000-0000-000000000001','Norway','NOR','J','https://flagcdn.com/no.svg'),
  ('10000000-0000-0000-0000-000000000001','Ivory Coast','CIV','J','https://flagcdn.com/ci.svg'),
  ('10000000-0000-0000-0000-000000000001','Chile','CHI','J','https://flagcdn.com/cl.svg'),
  ('10000000-0000-0000-0000-000000000001','New Zealand','NZL','J','https://flagcdn.com/nz.svg'),
  ('10000000-0000-0000-0000-000000000001','Sweden','SWE','K','https://flagcdn.com/se.svg'),
  ('10000000-0000-0000-0000-000000000001','Algeria','ALG','K','https://flagcdn.com/dz.svg'),
  ('10000000-0000-0000-0000-000000000001','Paraguay','PAR','K','https://flagcdn.com/py.svg'),
  ('10000000-0000-0000-0000-000000000001','South Africa','RSA','K','https://flagcdn.com/za.svg'),
  ('10000000-0000-0000-0000-000000000001','Turkey','TUR','L','https://flagcdn.com/tr.svg'),
  ('10000000-0000-0000-0000-000000000001','Greece','GRE','L','https://flagcdn.com/gr.svg'),
  ('10000000-0000-0000-0000-000000000001','Costa Rica','CRC','L','https://flagcdn.com/cr.svg'),
  ('10000000-0000-0000-0000-000000000001','Jamaica','JAM','L','https://flagcdn.com/jm.svg')
on conflict (tournament_id, name) do nothing;

-- ── Fixtures (matchweek 1, mixed statuses to seed live + finished states) ─
insert into fixtures (tournament_id, stage, matchweek, kickoff_at, status, home_team_id, away_team_id, home_score, away_score, minute)
select '10000000-0000-0000-0000-000000000001','group',1, k.kickoff, k.status, h.id, a.id, k.hs, k.as_, k.minute
from (values
  ('Argentina','Saudi Arabia','2026-06-11T18:00:00Z','finished',2,1,90),
  ('France','Denmark',        '2026-06-11T21:00:00Z','finished',2,0,90),
  ('Brazil','South Korea',    '2026-06-12T18:00:00Z','finished',3,1,90),
  ('Spain','Japan',           '2026-06-12T21:00:00Z','live',1,0,67),
  ('England','Iran',          '2026-06-13T18:00:00Z','scheduled',null,null,null),
  ('Germany','Morocco',       '2026-06-13T21:00:00Z','scheduled',null,null,null),
  ('Portugal','Uruguay',      '2026-06-14T18:00:00Z','scheduled',null,null,null),
  ('Netherlands','Nigeria',   '2026-06-14T21:00:00Z','scheduled',null,null,null)
) as k(home,away,kickoff,status,hs,as_,minute)
join teams h on h.name = k.home and h.tournament_id = '10000000-0000-0000-0000-000000000001'
join teams a on a.name = k.away and a.tournament_id = '10000000-0000-0000-0000-000000000001';

-- ── Pool: Shepherd Family Syndicate ─────────────────────────────────────
insert into pools (id, tournament_id, owner_id, name, is_public, max_members,
                   teams_per_user, draft_at, draft_status, knockout_multiplier, prize_description)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Shepherd Family Syndicate',
  false, 12, 4,
  '2026-06-10T18:00:00Z', 'complete', true,
  'Eternal bragging rights + the Shepherd Cup (a real, slightly dented trophy).'
) on conflict (id) do nothing;

-- ── Members + snake-draft positions ─────────────────────────────────────
insert into pool_members (pool_id, user_id, role, draft_position)
values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','owner',  1),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','admin',  2),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','member', 3),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','member', 4),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005','member', 5),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000006','member', 6),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000007','member', 7),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000008','member', 8),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000009','member', 9)
on conflict (pool_id, user_id) do nothing;

-- ── Invite code ─────────────────────────────────────────────────────────
insert into invite_codes (pool_id, code, created_by, max_uses)
values ('20000000-0000-0000-0000-000000000001','SHEPHERD26','00000000-0000-0000-0000-000000000001', 20)
on conflict (code) do nothing;

-- ── Drafted teams (snake draft, 4 each = 36 of 48 picked) ───────────────
-- pick_number follows snake order across 9 managers x 4 rounds.
insert into drafted_teams (pool_id, user_id, team_id, pick_number)
select '20000000-0000-0000-0000-000000000001', u.id, t.id, d.pick
from (values
  -- round 1 (1→9)
  ('joel@drafted.app','Brazil',1),('kelly@drafted.app','France',2),('hayley@drafted.app','Argentina',3),
  ('mike@drafted.app','Spain',4),('luke@drafted.app','England',5),('murray@drafted.app','Portugal',6),
  ('sarah@drafted.app','Germany',7),('delys@drafted.app','Netherlands',8),('bridget@drafted.app','Belgium',9),
  -- round 2 (9→1, snake)
  ('bridget@drafted.app','Italy',10),('delys@drafted.app','Uruguay',11),('sarah@drafted.app','Croatia',12),
  ('murray@drafted.app','Morocco',13),('luke@drafted.app','Colombia',14),('mike@drafted.app','Japan',15),
  ('hayley@drafted.app','Mexico',16),('kelly@drafted.app','Switzerland',17),('joel@drafted.app','Senegal',18),
  -- round 3 (1→9)
  ('joel@drafted.app','United States',19),('kelly@drafted.app','Denmark',20),('hayley@drafted.app','South Korea',21),
  ('mike@drafted.app','Serbia',22),('luke@drafted.app','Poland',23),('murray@drafted.app','Ecuador',24),
  ('sarah@drafted.app','Nigeria',25),('delys@drafted.app','Ghana',26),('bridget@drafted.app','Turkey',27),
  -- round 4 (9→1, snake)
  ('bridget@drafted.app','Sweden',28),('delys@drafted.app','Norway',29),('sarah@drafted.app','Chile',30),
  ('murray@drafted.app','Iran',31),('luke@drafted.app','Egypt',32),('mike@drafted.app','Australia',33),
  ('hayley@drafted.app','Cameroon',34),('kelly@drafted.app','Wales',35),('joel@drafted.app','Peru',36)
) as d(email, team, pick)
join users u on u.email = d.email
join teams t on t.name = d.team and t.tournament_id = '10000000-0000-0000-0000-000000000001'
on conflict (pool_id, team_id) do nothing;

-- ── Scores (atomic events from finished MW1 fixtures) ───────────────────
-- Argentina beat KSA → Hayley +3; France beat Denmark → Kelly +3;
-- Brazil beat Korea → Joel +3 (Brazil) ... Hayley owns Korea → +0; etc.
insert into scores (pool_id, user_id, source, team_id, points, reason)
select '20000000-0000-0000-0000-000000000001', u.id, 'team_result', t.id, s.points, s.reason
from (values
  ('hayley@drafted.app','Argentina',3,'Argentina win (group)'),
  ('kelly@drafted.app','France',3,'France win (group)'),
  ('joel@drafted.app','Brazil',3,'Brazil win (group)'),
  ('hayley@drafted.app','South Korea',0,'South Korea loss (group)')
) as s(email, team, points, reason)
join users u on u.email = s.email
join teams t on t.name = s.team and t.tournament_id = '10000000-0000-0000-0000-000000000001';

-- ── Weekly Lock-In Predictions ──────────────────────────────────────────
-- Resolved MW1 prediction (Spain vs Japan winner) + active MW2 prediction.
insert into weekly_predictions (id, pool_id, matchweek, stage, type, prompt, locks_at, correct_option_id)
values
  ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,'group','match_winner',
   'Who wins Spain vs Japan?', '2026-06-12T20:55:00Z', null),
  ('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001',2,'group','both_teams_to_score',
   'Brazil vs Portugal — both teams to score?', '2026-06-16T20:55:00Z', null)
on conflict (id) do nothing;

insert into prediction_options (id, prediction_id, label, value, sort_order) values
  ('31000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Spain','home',0),
  ('31000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Draw','draw',1),
  ('31000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','Japan','away',2),
  ('32000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','Yes','yes',0),
  ('32000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','No','no',1)
on conflict (id) do nothing;

-- Entries for the active Spain/Japan prediction → powers the Consensus Trap.
-- 6 of 9 picked Spain (the trap: heavy favourite), 1 Draw, 2 Japan (minority).
insert into user_prediction_entries (prediction_id, user_id, option_id)
select '30000000-0000-0000-0000-000000000001', u.id, o.opt
from (values
  ('joel@drafted.app',   '31000000-0000-0000-0000-000000000001'),
  ('kelly@drafted.app',  '31000000-0000-0000-0000-000000000001'),
  ('mike@drafted.app',   '31000000-0000-0000-0000-000000000001'),
  ('luke@drafted.app',   '31000000-0000-0000-0000-000000000001'),
  ('delys@drafted.app',  '31000000-0000-0000-0000-000000000001'),
  ('murray@drafted.app', '31000000-0000-0000-0000-000000000001'),
  ('sarah@drafted.app',  '31000000-0000-0000-0000-000000000002'),
  ('hayley@drafted.app', '31000000-0000-0000-0000-000000000003'),
  ('bridget@drafted.app','31000000-0000-0000-0000-000000000003')
) as e(email, option_id)
join users u on u.email = e.email
cross join lateral (select e.option_id::uuid as opt) o
on conflict (prediction_id, user_id) do nothing;

-- ── Standings snapshot (drives the leaderboard before realtime kicks in) ─
insert into standings (pool_id, user_id, total_points, prediction_points, team_points, rank, previous_rank)
select '20000000-0000-0000-0000-000000000001', u.id, s.total, s.pred, s.team, s.rank, s.prev
from (values
  ('kelly@drafted.app', 11, 2, 9, 1, 2),
  ('hayley@drafted.app',10, 0,10, 2, 4),
  ('joel@drafted.app',   9, 2, 7, 3, 1),
  ('sarah@drafted.app',  8, 2, 6, 4, 3),
  ('luke@drafted.app',   6, 2, 4, 5, 5),
  ('delys@drafted.app',  5, 0, 5, 6, 6),
  ('mike@drafted.app',   4, 2, 2, 7, 7),
  ('murray@drafted.app', 3, 0, 3, 8, 9),
  ('bridget@drafted.app',2, 0, 2, 9, 8)
) as s(email, total, pred, team, rank, prev)
join users u on u.email = s.email
on conflict (pool_id, user_id) do update
  set total_points = excluded.total_points, rank = excluded.rank, previous_rank = excluded.previous_rank;

-- ── Achievements / badges ───────────────────────────────────────────────
insert into achievements (user_id, pool_id, code, label, description)
select u.id, '20000000-0000-0000-0000-000000000001', a.code, a.label, a.descr
from (values
  ('kelly@drafted.app','oracle','Oracle','3 correct predictions in a row'),
  ('sarah@drafted.app','clutch','Clutch Predictor','Nailed a knockout-round call'),
  ('hayley@drafted.app','chaos','Chaos Merchant','Backed 3 underdogs in one week'),
  ('luke@drafted.app','ice','Ice In The Veins','Submitted at the deadline 5x running'),
  ('bridget@drafted.app','upset','Upset King','Called a result <25% of the pool picked')
) as a(email, code, label, descr)
join users u on u.email = a.email
on conflict (user_id, pool_id, code) do nothing;

-- ── Rivalries ───────────────────────────────────────────────────────────
insert into rivalries (pool_id, user_a, user_b, name, intensity, stats)
select '20000000-0000-0000-0000-000000000001', a.id, b.id, r.name, r.intensity, r.stats::jsonb
from (values
  ('joel@drafted.app','mike@drafted.app','The Tactical Fraud Derby',82,'{"h2h":"3-1","point_gap":5,"stolen_picks":1}'),
  ('kelly@drafted.app','sarah@drafted.app','The Oracle War',74,'{"h2h":"2-2","point_gap":3,"prediction_clashes":6}'),
  ('hayley@drafted.app','bridget@drafted.app','Sibling Supremacy',91,'{"h2h":"4-3","point_gap":8,"upset_battles":5}')
) as r(email_a, email_b, name, intensity, stats)
join users a on a.email = r.email_a
join users b on b.email = r.email_b
on conflict (pool_id, user_a, user_b) do nothing;

-- ── Stories (auto-card feed) ────────────────────────────────────────────
insert into stories (pool_id, subject_user, kind, headline, body, payload)
select '20000000-0000-0000-0000-000000000001', u.id, s.kind, s.headline, s.body, s.payload::jsonb
from (values
  ('kelly@drafted.app','rank_jump','Kelly storms to first after France cruise','The Oracle climbs from 2nd to 1st as France handle Denmark.','{"from":2,"to":1,"flag":"fr"}'),
  ('joel@drafted.app','rank_drop','The Commissioner slips to third','Joel''s early lead evaporates as rivals pile on points.','{"from":1,"to":3,"flag":"br"}'),
  ('hayley@drafted.app','clutch','Chaos Merchant''s Argentina gamble pays off','Hayley banks +3 as Argentina survive a Saudi scare.','{"flag":"ar","points":3}'),
  ('bridget@drafted.app','heartbreak','Bridget watching Spain vs Japan through her fingers','Her minority Japan pick is one goal from glory — or disaster.','{"flag":"jp","live":true}')
) as s(email, kind, headline, body, payload)
join users u on u.email = s.email;

-- ── Announcements + a poll ──────────────────────────────────────────────
insert into announcements (pool_id, author_id, title, body, is_poll, poll_options)
values
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',
   'Draft complete — let the games begin','Rosters are locked. First Lock-In closes before Spain vs Japan. Good luck, and may the better Shepherd win.', false, null),
  ('20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
   'Knockout multiplier — keep it on?','Admins enabled 2× knockout points. Vote to keep it for the round of 16.', true,
   '[{"label":"Keep 2x","votes":5},{"label":"Back to normal","votes":2}]'::jsonb);

-- ── Chat (the banter) ───────────────────────────────────────────────────
insert into chat_messages (pool_id, user_id, body)
select '20000000-0000-0000-0000-000000000001', u.id, c.body
from (values
  ('mike@drafted.app','Drafting Japan was a masterstroke and you''ll all see why 🇯🇵'),
  ('kelly@drafted.app','Mike you have Japan AND you predicted Spain. Pick a lane.'),
  ('hayley@drafted.app','Japan 1-0 and I''m taking the whole pot 😈'),
  ('joel@drafted.app','As commissioner I''m legally required to remind you I''m in first. Was. I was in first.'),
  ('bridget@drafted.app','67th minute. I can''t watch.')
) as c(email, body)
join users u on u.email = c.email;

commit;

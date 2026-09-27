-- OfCourse — LIGHTBULB VOTES + LUMENS
--
-- Every post and comment has a lightbulb. A verified student can switch it
-- ON (helpful) or OFF (not helpful), once per post/comment. Brightness (1-5)
-- comes from the ON/OFF ratio, adjusted for how many votes there are (Wilson
-- score lower bound), so 1 vote never beats 50. A user's Lumens = ON votes
-- received minus half their OFF votes, never below 0.
--
-- Existing votes are kept: upvotes (value 1) become ON votes; downvotes, if
-- any remain, become OFF votes (value -1).
--
-- Safe to run more than once.

begin;

-- ---------------------------------------------------------------------------
-- 1. Brightness from ON/OFF counts
-- ---------------------------------------------------------------------------

-- Wilson score lower bound (95%) of the share of ON votes.
create or replace function public.bulb_score(lit int, off int)
returns float8
language sql
immutable
set search_path = ''
as $$
  select case when lit + off = 0 then 0 else
    ((lit::float8 / (lit + off)) + 1.9208 / (lit + off)
      - 1.96 * sqrt(((lit::float8 / (lit + off)) * (1 - lit::float8 / (lit + off)) + 0.9604 / (lit + off)) / (lit + off)))
    / (1 + 3.8416 / (lit + off))
  end
$$;

-- 0 = unlit (too few votes yet), 1 = cracked, 2 = dim, 3 = glowing,
-- 4 = bright, 5 = radiant. Cracked needs clearly negative feedback: at least
-- 5 OFF votes and a low ON share, never just a lack of votes.
create or replace function public.bulb_level(lit int, off int)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select (case
    when off >= 5 and lit::float8 / (lit + off) < 0.35 then 1
    when lit + off < 3 then 0
    when public.bulb_score(lit, off) >= 0.8 then 5
    when public.bulb_score(lit, off) >= 0.6 then 4
    when public.bulb_score(lit, off) >= 0.35 then 3
    else 2
  end)::smallint
$$;

-- ---------------------------------------------------------------------------
-- 2. Post votes: ON (1) or OFF (-1)
-- ---------------------------------------------------------------------------

alter table public.votes drop constraint if exists votes_value_check;
alter table public.votes add constraint votes_value_check check (value in (-1, 1));

alter table public.posts add column if not exists lit_count integer not null default 0;
alter table public.posts add column if not exists off_count integer not null default 0;
alter table public.posts add column if not exists brightness_score float8 not null default 0;
alter table public.posts add column if not exists brightness_level smallint not null default 0;
create index if not exists posts_course_brightness_idx on public.posts (course_id, brightness_score desc);

-- Changing an existing vote needs the same rights as casting one.
drop policy if exists "Users change own votes" on public.votes;
create policy "Users change own votes" on public.votes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.can_participate(public.post_course_id(post_id)));

-- ---------------------------------------------------------------------------
-- 3. Comment votes
-- ---------------------------------------------------------------------------

create table if not exists public.comment_votes (
  comment_id  uuid not null references public.comments (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists comment_votes_user_idx on public.comment_votes (user_id);

alter table public.comments add column if not exists lit_count integer not null default 0;
alter table public.comments add column if not exists off_count integer not null default 0;
alter table public.comments add column if not exists brightness_score float8 not null default 0;
alter table public.comments add column if not exists brightness_level smallint not null default 0;

create or replace function public.comment_course_id(p_comment_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.course_id from public.comments c join public.posts p on p.id = c.post_id where c.id = p_comment_id
$$;
revoke execute on function public.comment_course_id(uuid) from public, anon;
grant execute on function public.comment_course_id(uuid) to authenticated;

alter table public.comment_votes enable row level security;
drop policy if exists "Comment votes are public" on public.comment_votes;
create policy "Comment votes are public" on public.comment_votes for select using (true);
drop policy if exists "Verified students light comments" on public.comment_votes;
create policy "Verified students light comments" on public.comment_votes
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_participate(public.comment_course_id(comment_id)));
drop policy if exists "Students change their comment votes" on public.comment_votes;
create policy "Students change their comment votes" on public.comment_votes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.can_participate(public.comment_course_id(comment_id)));
drop policy if exists "Students remove their comment votes" on public.comment_votes;
create policy "Students remove their comment votes" on public.comment_votes
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.comment_votes from anon, authenticated;
grant select on public.comment_votes to anon, authenticated;
grant delete on public.comment_votes to authenticated;
grant insert (comment_id, user_id, value) on public.comment_votes to authenticated;
grant update (value) on public.comment_votes to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Lumens
-- ---------------------------------------------------------------------------

alter table public.profiles add column if not exists lumens integer not null default 0;

create or replace function public.recount_lumens(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set lumens = greatest(0, round(
    coalesce((select sum(lit_count) - 0.5 * sum(off_count) from public.posts where author_id = p_user_id), 0)
    + coalesce((select sum(lit_count) - 0.5 * sum(off_count) from public.comments where author_id = p_user_id), 0)
  ))::int
  where id = p_user_id
$$;
revoke execute on function public.recount_lumens(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Keeping counts right. Each change re-counts from the votes table, so
--    simultaneous votes can't leave a counter off by one.
-- ---------------------------------------------------------------------------

create or replace function public.recount_post_bulb(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lit int;
  off int;
  author uuid;
begin
  select count(*) filter (where value = 1), count(*) filter (where value = -1)
    into lit, off from public.votes where post_id = p_post_id;
  update public.posts
  set lit_count = lit, off_count = off, vote_score = lit - off,
      brightness_score = public.bulb_score(lit, off), brightness_level = public.bulb_level(lit, off)
  where id = p_post_id
  returning author_id into author;
  if author is not null then perform public.recount_lumens(author); end if;
end;
$$;
revoke execute on function public.recount_post_bulb(uuid) from public, anon, authenticated;

create or replace function public.recount_comment_bulb(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  lit int;
  off int;
  author uuid;
begin
  select count(*) filter (where value = 1), count(*) filter (where value = -1)
    into lit, off from public.comment_votes where comment_id = p_comment_id;
  update public.comments
  set lit_count = lit, off_count = off,
      brightness_score = public.bulb_score(lit, off), brightness_level = public.bulb_level(lit, off)
  where id = p_comment_id
  returning author_id into author;
  if author is not null then perform public.recount_lumens(author); end if;
end;
$$;
revoke execute on function public.recount_comment_bulb(uuid) from public, anon, authenticated;

create or replace function public.sync_post_vote_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recount_post_bulb(coalesce(new.post_id, old.post_id));
  if tg_op = 'UPDATE' and new.post_id <> old.post_id then perform public.recount_post_bulb(old.post_id); end if;
  return null;
end;
$$;

drop trigger if exists votes_sync_post_score on public.votes;
create trigger votes_sync_post_score
  after insert or update or delete on public.votes
  for each row execute function public.sync_post_vote_score();

create or replace function public.sync_comment_bulb()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.recount_comment_bulb(coalesce(new.comment_id, old.comment_id));
  return null;
end;
$$;

drop trigger if exists comment_votes_sync on public.comment_votes;
create trigger comment_votes_sync
  after insert or update or delete on public.comment_votes
  for each row execute function public.sync_comment_bulb();

-- ---------------------------------------------------------------------------
-- 6. Demo data: a spread of brightness levels so every bulb state shows up
-- ---------------------------------------------------------------------------

create or replace function pg_temp.demo_id(prefix text, n int) returns uuid
language sql immutable as $$
  select (prefix || '0000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid
$$;

-- Two posts students found unhelpful, and a brand-new question (fictional).
insert into public.posts (id, course_id, author_id, title, content, type, semester, integrity_attested_at, created_at, updated_at)
select pg_temp.demo_id('b', t.n), c.id, pg_temp.demo_id('d', t.author), t.title, t.content, t.type::public.post_type,
       t.semester, now() - t.days * interval '1 day', now() - t.days * interval '1 day', now() - t.days * interval '1 day'
from (values
  (1, 'cs1332', 22, 'discussion', 'Just drop it if you are struggling lol', 'Honestly not worth the stress. Drop and take it later.', 'Spring 2026', 20),
  (2, 'cs1332', 27, 'advice', 'You can skip lectures, the slides are enough', 'I skipped most lectures and read the slides the night before. Worked out okay I guess.', 'Fall 2025', 40),
  (3, 'cs1332', 9, 'discussion', 'Anyone else doing the heaps homework tonight?', 'Starting it now. Is the resize edge case covered in lecture or just the homework spec?', 'Fall 2026', 0.2)
) as t (n, slug, author, type, title, content, semester, days)
join public.courses c on c.slug = t.slug
where exists (select 1 from public.profiles where id = pg_temp.demo_id('d', t.author))
on conflict (id) do nothing;

-- Votes from demo students: OFF votes on a few posts (dim and cracked), and
-- a mix elsewhere so levels vary. Deterministic, so re-running changes nothing.
insert into public.votes (post_id, user_id, value)
select p.id, s.id, case when v.off then -1 else 1 end
from (values
  (pg_temp.demo_id('b', 1), 1, 8),   -- cracked: 1 ON, 8 OFF
  (pg_temp.demo_id('b', 2), 4, 4),   -- dim: 4 ON, 4 OFF
  (pg_temp.demo_id('b', 3), 1, 0)    -- unlit: brand new, one vote
) as plan (post_id, lit, off)
join public.posts p on p.id = plan.post_id
cross join lateral (
  select d.id, row_number() over (order by d.id) as rn
  from public.profiles d
  where d.id::text like 'd0000000-%' and d.id <> p.author_id
  limit plan.lit + plan.off
) s
cross join lateral (select s.rn > plan.lit as off) v
on conflict (post_id, user_id) do nothing;

-- A few OFF votes on some regular posts, so not every bulb is radiant.
insert into public.votes (post_id, user_id, value)
select p.id, d.id, -1
from public.posts p
join public.profiles d on d.id::text like 'd0000000-%' and d.id <> p.author_id
where p.id::text like 'e0000000-%'
  and abs(hashtext(p.id::text)) % 3 = 0
  and abs(hashtext(p.id::text || d.id::text)) % 100 < 12
on conflict (post_id, user_id) do nothing;

-- Comment votes: mostly ON, so helpful replies glow.
insert into public.comment_votes (comment_id, user_id, value)
select c.id, d.id, case when abs(hashtext(c.id::text || d.id::text || 'off')) % 100 < 10 then -1 else 1 end
from public.comments c
join public.profiles d on d.id::text like 'd0000000-%' and d.id <> c.author_id
where c.deleted_at is null
  and abs(hashtext(c.id::text || d.id::text)) % 100 < 4 + abs(hashtext(c.id::text)) % 18
on conflict (comment_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Recount everything (migrates existing votes into ON/OFF counts)
-- ---------------------------------------------------------------------------

update public.posts p
set lit_count = v.lit, off_count = v.off, vote_score = v.lit - v.off,
    brightness_score = public.bulb_score(v.lit, v.off), brightness_level = public.bulb_level(v.lit, v.off)
from (
  select p2.id,
         (select count(*) from public.votes where post_id = p2.id and value = 1)::int as lit,
         (select count(*) from public.votes where post_id = p2.id and value = -1)::int as off
  from public.posts p2
) v
where v.id = p.id;

update public.comments c
set lit_count = v.lit, off_count = v.off,
    brightness_score = public.bulb_score(v.lit, v.off), brightness_level = public.bulb_level(v.lit, v.off)
from (
  select c2.id,
         (select count(*) from public.comment_votes where comment_id = c2.id and value = 1)::int as lit,
         (select count(*) from public.comment_votes where comment_id = c2.id and value = -1)::int as off
  from public.comments c2
) v
where v.id = c.id;

select public.recount_lumens(id) from public.profiles;

commit;

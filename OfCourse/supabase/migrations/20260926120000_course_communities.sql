-- OfCourse Phase 2 — course communities
--
-- Adds course URLs (slugs), course stats, and denormalized post counters
-- (vote_score, comment_count, hot_score) kept in sync by triggers so feeds can
-- sort by Hot / New / Top with plain indexed queries.

-- ---------------------------------------------------------------------------
-- Universities & courses
-- ---------------------------------------------------------------------------

alter table public.universities add column short_name text;

-- URL-friendly course id used in /c/<slug>, e.g. 'cs1332'.
alter table public.courses add column slug text;
update public.courses set slug = lower(regexp_replace(code, '\s+', '', 'g'));
alter table public.courses
  alter column slug set not null,
  add constraint courses_slug_key unique (slug),
  add constraint courses_slug_format check (slug ~ '^[a-z0-9-]+$');

-- Aggregated student-reported course stats. Seeded with demo data for now.
create table public.course_stats (
  course_id                uuid primary key references public.courses (id) on delete cascade,
  workload_hours_per_week  numeric(4, 1) not null check (workload_hours_per_week >= 0),
  difficulty               numeric(3, 1) not null check (difficulty between 0 and 10),
  would_take_again_pct     smallint not null check (would_take_again_pct between 0 and 100),
  response_count           integer not null check (response_count >= 0),
  is_demo                  boolean not null default true,
  updated_at               timestamptz not null default now()
);

alter table public.course_stats enable row level security;
create policy "Course stats are public" on public.course_stats for select using (true);

-- ---------------------------------------------------------------------------
-- Post counters and ranking
-- ---------------------------------------------------------------------------

-- Reddit-style "hot" rank. It depends only on score and creation time, so it
-- can be stored and indexed. Every 10x in score is worth 30 days of recency
-- (course communities move slower than a general news feed).
create or replace function public.post_hot_score(score integer, created timestamptz)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select sign(score::double precision) * log(greatest(abs(score), 1)::double precision)
       + extract(epoch from created) / 2592000.0
$$;

alter table public.posts
  add column vote_score    integer not null default 0,
  add column comment_count integer not null default 0,
  add column hot_score     double precision
    generated always as (public.post_hot_score(vote_score, created_at)) stored;

create index posts_course_id_hot_score_idx on public.posts (course_id, hot_score desc);
create index posts_course_id_vote_score_idx on public.posts (course_id, vote_score desc);

-- Only bump updated_at when the author edits the post, not when counters change.
drop trigger posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update of title, content, type, semester on public.posts
  for each row execute function public.set_updated_at();

-- Counters are maintained here (as the table owner) because voters and
-- commenters are not allowed to update other people's posts.
create or replace function public.sync_post_vote_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set vote_score = vote_score + new.value where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set vote_score = vote_score - old.value where id = old.post_id;
  else
    update public.posts set vote_score = vote_score - old.value + new.value where id = new.post_id;
  end if;
  return null;
end;
$$;

create trigger votes_sync_post_score
  after insert or update of value or delete on public.votes
  for each row execute function public.sync_post_vote_score();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  else
    update public.posts set comment_count = comment_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger comments_sync_post_count
  after insert or delete on public.comments
  for each row execute function public.sync_post_comment_count();

-- ---------------------------------------------------------------------------
-- Column-level write permissions
--
-- RLS decides which rows a user may write; these grants decide which columns.
-- Clients must never set counters, ids, timestamps or verification directly.
-- ---------------------------------------------------------------------------

revoke insert, update on public.posts from anon, authenticated;
grant insert (course_id, author_id, title, content, type, semester, integrity_attested_at)
  on public.posts to authenticated;
grant update (title, content, type, semester) on public.posts to authenticated;

revoke insert, update on public.comments from anon, authenticated;
grant insert (post_id, author_id, parent_comment_id, content) on public.comments to authenticated;
grant update (content) on public.comments to authenticated;

revoke insert, update on public.votes from anon, authenticated;
grant insert (post_id, user_id, value) on public.votes to authenticated;
grant update (value) on public.votes to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (name, username, university_id, major, grad_year, bio, avatar_url)
  on public.profiles to authenticated;

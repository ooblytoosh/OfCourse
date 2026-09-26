-- OfCourse — downvotes and student course ratings
--
-- Downvotes need no schema change: votes.value already allows -1 and 1, one
-- vote per student per post, and the vote_score trigger handles changes.

-- ---------------------------------------------------------------------------
-- Course ratings: each student rates a course once (and can update it).
-- Individual ratings are private; only averages are public.
-- ---------------------------------------------------------------------------

create table public.course_ratings (
  user_id           uuid not null references public.profiles (id) on delete cascade,
  course_id         uuid not null references public.courses (id) on delete cascade,
  workload_hours    smallint not null check (workload_hours between 0 and 60),
  difficulty        smallint not null check (difficulty between 1 and 10),
  would_take_again  boolean not null,
  semester          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index course_ratings_course_id_idx on public.course_ratings (course_id);

create trigger course_ratings_set_updated_at
  before update on public.course_ratings
  for each row execute function public.set_updated_at();

alter table public.course_ratings enable row level security;

create policy "Students see their own ratings" on public.course_ratings
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students rate courses" on public.course_ratings
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update their ratings" on public.course_ratings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Students remove their ratings" on public.course_ratings
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke insert, update on public.course_ratings from anon, authenticated;
grant insert (user_id, course_id, workload_hours, difficulty, would_take_again, semester)
  on public.course_ratings to authenticated;
grant update (workload_hours, difficulty, would_take_again, semester)
  on public.course_ratings to authenticated;

-- Public averages. The view runs with its owner's rights so it can aggregate
-- every rating while individual rows stay private.
create view public.course_rating_stats as
select
  course_id,
  count(*)::int as rating_count,
  round(avg(workload_hours), 1)::float8 as avg_workload_hours,
  round(avg(difficulty), 1)::float8 as avg_difficulty,
  round(100.0 * avg(case when would_take_again then 1 else 0 end))::int as would_take_again_pct
from public.course_ratings
group by course_id;

revoke all on public.course_rating_stats from anon, authenticated;
grant select on public.course_rating_stats to anon, authenticated;

-- The placeholder stats table from Phase 2 held demo numbers only; real
-- averages come from course_ratings now.
drop table public.course_stats;

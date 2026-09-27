-- OfCourse — REVIEWS COUNT TOWARD COURSE STATS
--
-- A course review now includes the student's hours per week, difficulty
-- (1-10) and whether they'd take it again. Those numbers show on the review
-- and update the student's course rating, which feeds the averages on the
-- course page (course_rating_stats).
--
-- Each student counts once per course: writing a second review (or editing
-- one) updates their rating instead of adding another, so nobody can move
-- the averages by posting many reviews.
--
-- Safe to run more than once.

begin;

-- ---------------------------------------------------------------------------
-- 1. Rating fields on reviews
-- ---------------------------------------------------------------------------

alter table public.posts add column if not exists review_workload_hours smallint;
alter table public.posts add column if not exists review_difficulty smallint;
alter table public.posts add column if not exists review_would_take_again boolean;

alter table public.posts drop constraint if exists posts_review_rating_check;
alter table public.posts add constraint posts_review_rating_check check (
  (review_workload_hours is null or review_workload_hours between 0 and 60)
  and (review_difficulty is null or review_difficulty between 1 and 10)
  -- Only course reviews carry a rating, and it's all three numbers or none.
  and (
    (review_workload_hours is null and review_difficulty is null and review_would_take_again is null)
    or (type = 'experience' and review_workload_hours is not null and review_difficulty is not null
        and review_would_take_again is not null)
  )
);

grant insert (review_workload_hours, review_difficulty, review_would_take_again) on public.posts to authenticated;
grant update (review_workload_hours, review_difficulty, review_would_take_again) on public.posts to authenticated;

-- ---------------------------------------------------------------------------
-- 2. A review's numbers become the author's course rating
-- ---------------------------------------------------------------------------

-- Runs as the table owner so it can write the rating, but only ever for the
-- post's own author and course. Posting a review already requires being a
-- verified student at the course's university (posts policies).
create or replace function public.sync_review_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'experience' and new.review_workload_hours is not null then
    insert into public.course_ratings (user_id, course_id, workload_hours, difficulty, would_take_again, semester)
    values (new.author_id, new.course_id, new.review_workload_hours, new.review_difficulty,
            new.review_would_take_again, new.semester)
    on conflict (user_id, course_id) do update
      set workload_hours = excluded.workload_hours,
          difficulty = excluded.difficulty,
          would_take_again = excluded.would_take_again,
          semester = coalesce(excluded.semester, public.course_ratings.semester);
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_review_rating() from public, anon, authenticated;

drop trigger if exists posts_sync_review_rating on public.posts;
create trigger posts_sync_review_rating
  after insert or update of review_workload_hours, review_difficulty, review_would_take_again, semester, type
  on public.posts
  for each row execute function public.sync_review_rating();

-- ---------------------------------------------------------------------------
-- 3. Existing reviews show their author's rating, where there is one
-- ---------------------------------------------------------------------------

update public.posts p
set review_workload_hours = r.workload_hours,
    review_difficulty = r.difficulty,
    review_would_take_again = r.would_take_again
from public.course_ratings r
where p.type = 'experience'
  and r.user_id = p.author_id
  and r.course_id = p.course_id
  and p.review_workload_hours is null;

commit;

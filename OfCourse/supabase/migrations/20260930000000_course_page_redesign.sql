-- OfCourse — course page redesign
--
-- 1. Votes become a single "Helpful" mark: existing downvotes are removed and
--    only value = 1 is allowed, so posts.vote_score is the number of students
--    who found a post helpful.
-- 2. Syllabus units: each course's topics are grouped into ordered units.

-- ---------------------------------------------------------------------------
-- Helpful votes only
-- ---------------------------------------------------------------------------

-- The vote_score trigger adjusts each post's score as these rows go away.
delete from public.votes where value <> 1;

alter table public.votes drop constraint votes_value_check;
alter table public.votes add constraint votes_value_check check (value = 1);

-- ---------------------------------------------------------------------------
-- Syllabus units
-- ---------------------------------------------------------------------------

create table public.course_units (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  position    smallint not null check (position > 0),
  name        text not null check (length(trim(name)) > 0),
  unique (course_id, position)
);

alter table public.course_units enable row level security;
create policy "Course units are public" on public.course_units for select using (true);

alter table public.topics
  add column unit_id uuid references public.course_units (id) on delete set null;

create index topics_unit_id_idx on public.topics (unit_id);

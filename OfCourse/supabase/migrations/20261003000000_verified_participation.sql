-- OfCourse — only verified students take part, and only at their own university
--
-- Anyone can read. Joining a course, posting, commenting, upvoting, rating
-- and asking the AI need a profile that is university verified, at the same
-- university as the course. Existing content is untouched, and students can
-- still leave courses, save posts, and edit or delete what they wrote.

-- True when the signed-in student is verified at this course's university.
create or replace function public.can_participate(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join public.courses c on c.university_id = p.university_id
    where p.id = (select auth.uid())
      and p.verified
      and c.id = p_course_id
  )
$$;

revoke execute on function public.can_participate(uuid) from public, anon;
grant execute on function public.can_participate(uuid) to authenticated;

-- The course a post belongs to (for comments and votes).
create or replace function public.post_course_id(p_post_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select course_id from public.posts where id = p_post_id
$$;

revoke execute on function public.post_course_id(uuid) from public, anon;
grant execute on function public.post_course_id(uuid) to authenticated;

-- Joining
drop policy if exists "Users join courses" on public.course_members;
create policy "Verified students join their university's courses" on public.course_members
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_participate(course_id));

-- Posting
drop policy if exists "Users create own posts" on public.posts;
create policy "Verified students post in their university's courses" on public.posts
  for insert to authenticated
  with check ((select auth.uid()) = author_id and public.can_participate(course_id));

-- Commenting
drop policy if exists "Users create own comments" on public.comments;
create policy "Verified students comment in their university's courses" on public.comments
  for insert to authenticated
  with check (
    (select auth.uid()) = author_id
    and public.can_participate(public.post_course_id(post_id))
  );

-- Upvoting
drop policy if exists "Users cast own votes" on public.votes;
create policy "Verified students upvote in their university's courses" on public.votes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and public.can_participate(public.post_course_id(post_id))
  );

-- Rating
drop policy if exists "Students rate courses" on public.course_ratings;
create policy "Verified students rate their university's courses" on public.course_ratings
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_participate(course_id));
drop policy if exists "Students update their ratings" on public.course_ratings;
create policy "Verified students update their ratings" on public.course_ratings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.can_participate(course_id));

-- AI chats and the AI question log
drop policy if exists "Students start their own chats" on public.ai_conversations;
create policy "Verified students start chats in their university's courses" on public.ai_conversations
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_participate(course_id));
drop policy if exists "Students log their own questions" on public.ai_search_log;
create policy "Verified students log their own questions" on public.ai_search_log
  for insert to authenticated
  with check ((select auth.uid()) = user_id and public.can_participate(course_id));

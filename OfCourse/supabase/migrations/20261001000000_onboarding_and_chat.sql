-- OfCourse — onboarding (terms of service) and saved AI chats

-- ---------------------------------------------------------------------------
-- Terms of service: set once, when a student agrees on the welcome screen.
-- ---------------------------------------------------------------------------

alter table public.profiles add column terms_accepted_at timestamptz;

-- The fictional demo students don't go through onboarding.
update public.profiles
set terms_accepted_at = created_at
where id::text like 'd0000000-%' and terms_accepted_at is null;

-- Students can't write this column directly; they agree through this function,
-- which records the current time for the signed-in student only.
create or replace function public.accept_terms()
returns timestamptz
language sql
security definer
set search_path = ''
as $$
  update public.profiles
  set terms_accepted_at = coalesce(terms_accepted_at, now())
  where id = auth.uid()
  returning terms_accepted_at
$$;

revoke execute on function public.accept_terms() from public, anon;
grant execute on function public.accept_terms() to authenticated;

-- ---------------------------------------------------------------------------
-- Saved AI chats: private to each student, one list per course.
-- ---------------------------------------------------------------------------

create table public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null check (length(title) between 1 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index ai_conversations_user_course_idx
  on public.ai_conversations (user_id, course_id, updated_at desc);

create table public.ai_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.ai_conversations (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null check (length(content) <= 8000),
  -- For answers: the student posts used, as [{"post_id", "similarity", "cited"}].
  -- Posts are always re-loaded through the normal API when a chat is shown.
  sources          jsonb not null default '[]'::jsonb,
  status           text not null default 'answer' check (status in ('answer', 'no_results')),
  created_at       timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "Students see their own chats" on public.ai_conversations
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students start their own chats" on public.ai_conversations
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update their own chats" on public.ai_conversations
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Students delete their own chats" on public.ai_conversations
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Students see messages in their chats" on public.ai_messages
  for select to authenticated using (
    exists (select 1 from public.ai_conversations c
            where c.id = conversation_id and c.user_id = (select auth.uid()))
  );
create policy "Students add messages to their chats" on public.ai_messages
  for insert to authenticated with check (
    exists (select 1 from public.ai_conversations c
            where c.id = conversation_id and c.user_id = (select auth.uid()))
  );

revoke insert, update on public.ai_conversations from anon, authenticated;
grant insert (user_id, course_id, title) on public.ai_conversations to authenticated;
grant update (title, updated_at) on public.ai_conversations to authenticated;

revoke insert, update, delete on public.ai_messages from anon, authenticated;
grant insert (conversation_id, role, content, sources, status) on public.ai_messages to authenticated;

-- OfCourse initial schema (Phase 1 — foundation)
--
-- Identity lives in Supabase Auth (auth.users). Public profile data lives in
-- public.profiles, keyed by the same id and created automatically on sign-up.
-- Email is intentionally NOT copied into profiles: profiles are publicly
-- readable and email stays private in auth.users.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.post_type as enum (
  'note',
  'study_guide',
  'explanation',
  'advice',
  'experience',
  'discussion',
  'resource'
);

-- ---------------------------------------------------------------------------
-- Universities & courses
-- ---------------------------------------------------------------------------

create table public.universities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- Student email domain, e.g. 'gatech.edu'. Used to match new users.
  domain      text not null unique check (domain = lower(domain)),
  created_at  timestamptz not null default now()
);

create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  university_id  uuid not null references public.universities (id) on delete cascade,
  -- Display code, e.g. 'CS 1332'. Unique per university.
  code           text not null check (length(trim(code)) > 0),
  name           text not null,
  description    text,
  created_at     timestamptz not null default now(),
  unique (university_id, code)
);

-- ---------------------------------------------------------------------------
-- Profiles (the "users" table)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           text,
  -- Nullable until the user picks one during onboarding.
  username       text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  university_id  uuid references public.universities (id) on delete set null,
  major          text,
  grad_year      smallint check (grad_year between 1950 and 2100),
  bio            text check (length(bio) <= 500),
  avatar_url     text,
  -- Set by a trusted process only (see the guard trigger below).
  verified       boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index profiles_university_id_idx on public.profiles (university_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Users may edit their own profile, but must not be able to mark themselves
-- verified. Only privileged roles (service role / SQL editor) may change it.
create or replace function public.guard_profile_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.verified is distinct from old.verified
     and current_user in ('anon', 'authenticated') then
    raise exception 'verified can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_verified
  before update on public.profiles
  for each row execute function public.guard_profile_verified();

-- Create a profile whenever a new auth user signs up. The university is
-- inferred from the email domain when it matches a known university.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, university_id)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    (
      select u.id
      from public.universities u
      where u.domain = lower(split_part(new.email, '@', 2))
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Course membership
-- ---------------------------------------------------------------------------

create table public.course_members (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  course_id  uuid not null references public.courses (id) on delete cascade,
  -- Term the student took/is taking the course, e.g. 'Fall 2025'.
  semester   text,
  joined_at  timestamptz not null default now(),
  primary key (user_id, course_id)
);

create index course_members_course_id_idx on public.course_members (course_id);

-- ---------------------------------------------------------------------------
-- Posts, comments, votes, bookmarks
-- ---------------------------------------------------------------------------

create table public.posts (
  id                     uuid primary key default gen_random_uuid(),
  course_id              uuid not null references public.courses (id) on delete cascade,
  author_id              uuid not null references public.profiles (id) on delete cascade,
  title                  text not null check (length(trim(title)) between 1 and 300),
  content                text not null default '',
  type                   public.post_type not null default 'discussion',
  semester               text,
  -- Academic-integrity attestation: when the author confirmed the post is
  -- their own work and contains no restricted course materials. Required.
  integrity_attested_at  timestamptz not null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index posts_course_id_created_at_idx on public.posts (course_id, created_at desc);
create index posts_author_id_idx on public.posts (author_id);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.comments (
  id                 uuid primary key default gen_random_uuid(),
  post_id            uuid not null references public.posts (id) on delete cascade,
  author_id          uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id  uuid references public.comments (id) on delete cascade,
  content            text not null check (length(trim(content)) > 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);
create index comments_author_id_idx on public.comments (author_id);

create trigger comments_set_updated_at
  before update on public.comments
  for each row execute function public.set_updated_at();

create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  value       smallint not null check (value in (-1, 1)),
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)
);

create index votes_user_id_idx on public.votes (user_id);

create table public.bookmarks (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  post_id     uuid not null references public.posts (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index bookmarks_post_id_idx on public.bookmarks (post_id);

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------

create table public.topics (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  unique (course_id, name)
);

create table public.post_topics (
  post_id   uuid not null references public.posts (id) on delete cascade,
  topic_id  uuid not null references public.topics (id) on delete cascade,
  primary key (post_id, topic_id)
);

create index post_topics_topic_id_idx on public.post_topics (topic_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Reads: course content is public so logged-out visitors can browse.
-- Writes: signed-in users may only create/modify rows they own.
-- Universities, courses and topics are managed by admins (SQL / service role).
-- ---------------------------------------------------------------------------

alter table public.universities   enable row level security;
alter table public.courses        enable row level security;
alter table public.profiles       enable row level security;
alter table public.course_members enable row level security;
alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.votes          enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.topics         enable row level security;
alter table public.post_topics    enable row level security;

-- Public read
create policy "Universities are public" on public.universities for select using (true);
create policy "Courses are public"      on public.courses      for select using (true);
create policy "Topics are public"       on public.topics       for select using (true);
create policy "Profiles are public"     on public.profiles     for select using (true);
create policy "Posts are public"        on public.posts        for select using (true);
create policy "Comments are public"     on public.comments     for select using (true);
create policy "Votes are public"        on public.votes        for select using (true);
create policy "Post topics are public"  on public.post_topics  for select using (true);
create policy "Course members are public" on public.course_members for select using (true);

-- Profiles: users edit only their own (rows are created by the sign-up trigger)
create policy "Users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Course membership
create policy "Users join courses" on public.course_members
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update own membership" on public.course_members
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users leave courses" on public.course_members
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Posts
create policy "Users create own posts" on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users update own posts" on public.posts
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy "Users delete own posts" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Comments
create policy "Users create own comments" on public.comments
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Users update own comments" on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id)
  with check ((select auth.uid()) = author_id);
create policy "Users delete own comments" on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Votes
create policy "Users cast own votes" on public.votes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users change own votes" on public.votes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users remove own votes" on public.votes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Bookmarks are private to their owner
create policy "Users see own bookmarks" on public.bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add own bookmarks" on public.bookmarks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove own bookmarks" on public.bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Post topics: only the post's author may tag it
create policy "Authors tag own posts" on public.post_topics
  for insert to authenticated with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );
create policy "Authors untag own posts" on public.post_topics
  for delete to authenticated using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

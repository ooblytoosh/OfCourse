-- OfCourse — sign-in and profile fixes
--
-- 1. University verification only comes from the student's own session.
--    Before, confirming an email (null -> timestamp on auth.users) verified the
--    profile right away. University mail scanners open every link in incoming
--    email, so a scanner "clicking" the confirmation link verified the account
--    before the student entered their code (and used up that code). Now only
--    claim_university_verification() verifies, and it needs a session that
--    signed in with the emailed code or link, which a scanner never gets.
-- 2. Majors come from a fixed list (public.majors); profiles.major must be one
--    of them or empty.

-- ---------------------------------------------------------------------------
-- 1. Verification
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_email_confirmed on auth.users;
drop function if exists public.handle_email_confirmed();

-- ---------------------------------------------------------------------------
-- 2. Majors
-- ---------------------------------------------------------------------------

create table if not exists public.majors (
  name text primary key check (length(name) between 1 and 80)
);

alter table public.majors enable row level security;
drop policy if exists "Majors are public" on public.majors;
create policy "Majors are public" on public.majors for select using (true);
revoke all on public.majors from anon, authenticated;
grant select on public.majors to anon, authenticated;

insert into public.majors (name) values
  ('Aerospace Engineering'),
  ('Applied Physics'),
  ('Architecture'),
  ('Arts, Entertainment, and Creative Technologies'),
  ('Astrophysics'),
  ('Atmospheric and Oceanic Sciences'),
  ('Biochemistry'),
  ('Biology'),
  ('Biomedical Engineering'),
  ('Chemistry'),
  ('Chemical and Biomolecular Engineering'),
  ('Civil Engineering'),
  ('Computational Media'),
  ('Computer Engineering'),
  ('Computer Science'),
  ('Construction Science and Management'),
  ('Economics'),
  ('Economics and International Affairs'),
  ('Electrical Engineering'),
  ('Environmental Engineering'),
  ('Environmental Science'),
  ('Global Economics and Modern Languages'),
  ('History, Technology, and Society'),
  ('Industrial Design'),
  ('Industrial Engineering'),
  ('International Affairs'),
  ('International Affairs and Modern Languages'),
  ('Literature, Media, and Communication'),
  ('Mathematics'),
  ('Mathematics and Computing'),
  ('Mechanical Engineering'),
  ('Music Technology'),
  ('Neuroscience'),
  ('Physics'),
  ('Psychology'),
  ('Public Policy'),
  ('Solid Earth and Planetary Sciences'),
  ('Urban Planning and Spatial Analytics')
on conflict (name) do nothing;

-- Majors typed in before the list existed are cleared (students pick again).
update public.profiles
set major = null
where major is not null and major not in (select name from public.majors);

alter table public.profiles drop constraint if exists profiles_major_fkey;
alter table public.profiles
  add constraint profiles_major_fkey foreign key (major) references public.majors (name) on update cascade;

-- Sign-up keeps a major only when it's on the list.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted_username text := lower(nullif(trim(meta ->> 'username'), ''));
  wanted_major text;
  wanted_year smallint;
begin
  begin
    wanted_year := (meta ->> 'grad_year')::smallint;
  exception when others then
    wanted_year := null;
  end;
  if wanted_year not between 1950 and 2100 then
    wanted_year := null;
  end if;
  if wanted_username !~ '^[a-z0-9_]{3,24}$'
     or exists (select 1 from public.profiles p where p.username = wanted_username) then
    wanted_username := null;
  end if;
  select m.name into wanted_major
  from public.majors m
  where m.name = nullif(trim(meta ->> 'major'), '');

  insert into public.profiles (id, name, username, major, grad_year)
  values (
    new.id,
    left(nullif(trim(meta ->> 'name'), ''), 80),
    wanted_username,
    wanted_major,
    wanted_year
  );
  return new;
end;
$$;

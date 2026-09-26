-- OfCourse Phase 3 — profiles and university email verification
--
-- A student is "university verified" when they have proven they control an
-- email address at a university's domain. That proof only ever comes from
-- Supabase Auth, through one of two trusted paths:
--
--   1. Supabase marks the account email as confirmed (the sign-up
--      confirmation link). The on_auth_user_email_confirmed trigger fires.
--   2. The user signs in from a link emailed to their address (magic link,
--      confirmation or email-change link). claim_university_verification()
--      checks the signed JWT's `amr` claim for that sign-in method.
--
-- The university is always derived from the verified email's domain, never
-- from anything the client sends. Clients cannot write verified, verified_at
-- or university_id (column grants + guard trigger).

alter table public.profiles add column verified_at timestamptz;

-- Until now the sign-up trigger linked users to a university by email domain
-- without verification. From now on only verification sets university_id.
update public.profiles set university_id = null where not verified;

-- ---------------------------------------------------------------------------
-- Write protection
-- ---------------------------------------------------------------------------

revoke update on public.profiles from anon, authenticated;
grant update (name, username, major, grad_year, bio, avatar_url)
  on public.profiles to authenticated;

-- Defense in depth: even if a grant is widened later, clients still can't
-- change verification fields.
create or replace function public.guard_profile_verified()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.verified is distinct from old.verified
    or new.verified_at is distinct from old.verified_at
    or new.university_id is distinct from old.university_id
  ) then
    raise exception 'verification fields can only be changed by the server';
  end if;
  return new;
end;
$$;

alter table public.profiles
  add constraint profiles_avatar_url_https check (avatar_url is null or avatar_url ~ '^https://');

-- ---------------------------------------------------------------------------
-- Verification
-- ---------------------------------------------------------------------------

-- The university whose domain matches an email address (subdomains count:
-- mail.gatech.edu matches gatech.edu).
create or replace function public.university_for_email(email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.id
  from public.universities u
  where lower(split_part(email, '@', 2)) = u.domain
     or lower(split_part(email, '@', 2)) like '%.' || u.domain
  order by length(u.domain) desc
  limit 1
$$;

-- Marks a user verified for the university matching `email`, or clears
-- verification when it matches none.
create or replace function public.apply_university_verification(user_id uuid, email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uni uuid := public.university_for_email(email);
begin
  update public.profiles
  set university_id = uni,
      verified = uni is not null,
      verified_at = case when uni is not null then now() end
  where id = user_id;
  return uni is not null;
end;
$$;

revoke execute on function public.apply_university_verification(uuid, text) from public, anon, authenticated;

-- Path 1: Supabase confirmed the account email (null -> timestamp).
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.apply_university_verification(new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_email_confirmed();

-- A changed email address must be verified again.
create or replace function public.handle_email_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set verified = false, verified_at = null, university_id = null
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_email_changed();

-- Path 2: called by the signed-in user after arriving from an email link.
-- Returns the verified university's id, or null if not verified.
create or replace function public.claim_university_verification()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  confirmed timestamptz;
  from_email_link boolean;
begin
  if uid is null then
    return null;
  end if;

  -- The JWT is signed by Supabase Auth, so its sign-in methods can be trusted.
  select exists (
    select 1
    from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
    where m ->> 'method' in ('otp', 'magiclink', 'email/signup', 'email_change', 'recovery', 'invite')
  ) into from_email_link;

  select u.email, u.email_confirmed_at into user_email, confirmed
  from auth.users u where u.id = uid;

  if not from_email_link or confirmed is null or user_email is null then
    return null;
  end if;

  if public.apply_university_verification(uid, user_email) then
    return public.university_for_email(user_email);
  end if;
  return null;
end;
$$;

revoke execute on function public.claim_university_verification() from public, anon;
grant execute on function public.claim_university_verification() to authenticated;

-- ---------------------------------------------------------------------------
-- Sign-up: fill the profile from sign-up details, but never the university.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  wanted_username text := lower(nullif(trim(meta ->> 'username'), ''));
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

  insert into public.profiles (id, name, username, major, grad_year)
  values (
    new.id,
    left(nullif(trim(meta ->> 'name'), ''), 80),
    wanted_username,
    left(nullif(trim(meta ->> 'major'), ''), 80),
    wanted_year
  );
  return new;
end;
$$;

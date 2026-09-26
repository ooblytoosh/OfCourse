-- OfCourse — avatar uploads, and editing/deleting your own posts and comments

-- ---------------------------------------------------------------------------
-- Avatars: a public Storage bucket. Each student may only write inside a
-- folder named after their own user id: avatars/<user id>/<file>.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Students manage their own avatar files (read)" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Students manage their own avatar files (upload)" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Students manage their own avatar files (delete)" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Uploaded avatars are served from the project's Storage URL.
alter table public.profiles drop constraint profiles_avatar_url_https;
alter table public.profiles
  add constraint profiles_avatar_url_format check (avatar_url is null or avatar_url ~ '^https?://');

-- ---------------------------------------------------------------------------
-- Editing posts: authors re-confirm academic integrity when they edit.
-- ---------------------------------------------------------------------------

grant update (integrity_attested_at) on public.posts to authenticated;

-- ---------------------------------------------------------------------------
-- Deleting comments: a comment with replies is soft-deleted so the thread
-- stays readable; one without replies is removed.
-- ---------------------------------------------------------------------------

alter table public.comments add column deleted_at timestamptz;
grant update (deleted_at) on public.comments to authenticated;

-- ---------------------------------------------------------------------------
-- "Edited" markers compare updated_at with created_at, so updated_at must only
-- move when the author changes the text.
-- ---------------------------------------------------------------------------

drop trigger comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
  before update of content on public.comments
  for each row execute function public.set_updated_at();

-- Nothing could be edited before this migration, so any gap between the two
-- timestamps (e.g. from backdated demo data) isn't a real edit.
update public.posts set updated_at = created_at where updated_at <> created_at;
update public.comments set updated_at = created_at where updated_at <> created_at;

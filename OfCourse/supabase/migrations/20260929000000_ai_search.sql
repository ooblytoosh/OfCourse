-- OfCourse Phase 4 — AI search over student knowledge (RAG)
--
-- Each post gets one embedding of its searchable text (title, type, topics,
-- course and body). A student's question is embedded the same way and the
-- closest posts *in the same course* are retrieved, then summarized with
-- links back to the original posts.
--
-- Embedding model: OpenAI text-embedding-3-small, which returns 1536
-- dimensions. The column size below must match EMBEDDING_DIMENSIONS in
-- src/lib/ai/config.ts.

create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Embeddings (written only by trusted server code with the service role)
-- ---------------------------------------------------------------------------

create table public.post_embeddings (
  post_id       uuid primary key references public.posts (id) on delete cascade,
  -- Copied from the post so searches can filter by course without a join.
  course_id     uuid not null references public.courses (id) on delete cascade,
  embedding     extensions.vector(1536) not null,
  model         text not null,
  -- Hash of the embedded text + model; unchanged posts are never re-embedded.
  content_hash  text not null,
  updated_at    timestamptz not null default now()
);

create index post_embeddings_course_id_idx on public.post_embeddings (course_id);

-- No client access at all: RLS on with no policies, and no grants.
alter table public.post_embeddings enable row level security;
revoke all on public.post_embeddings from anon, authenticated;

-- A vector index (HNSW) would speed up search across many thousands of posts,
-- but it filters *after* the approximate search, which can drop matches when
-- restricting to one course. At hackathon scale an exact scan per course is
-- fast and always correct. If the table grows large, add:
--   create index on public.post_embeddings
--     using hnsw (embedding extensions.vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Course-scoped semantic search
-- ---------------------------------------------------------------------------

-- Returns the posts in one course closest to the query embedding, most
-- similar first (similarity = cosine similarity, 1 = identical). Only post ids
-- are returned; the app loads the posts through the normal, RLS-protected API.
create or replace function public.match_course_posts(
  query_embedding extensions.vector(1536),
  p_course_id uuid,
  match_count int default 10
)
returns table (post_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = ''
as $$
  select pe.post_id,
         1 - (pe.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.post_embeddings pe
  where pe.course_id = p_course_id
  order by pe.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20)
$$;

revoke execute on function public.match_course_posts(extensions.vector, uuid, int) from public, anon;
grant execute on function public.match_course_posts(extensions.vector, uuid, int) to authenticated;

-- ---------------------------------------------------------------------------
-- Question log: per-student rate limiting (cost control) and debugging.
-- ---------------------------------------------------------------------------

create table public.ai_search_log (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  course_id     uuid references public.courses (id) on delete set null,
  question      text not null check (length(question) <= 500),
  source_count  integer not null default 0,
  created_at    timestamptz not null default now()
);

create index ai_search_log_user_id_created_at_idx on public.ai_search_log (user_id, created_at desc);

alter table public.ai_search_log enable row level security;

create policy "Students see their own questions" on public.ai_search_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students log their own questions" on public.ai_search_log
  for insert to authenticated with check ((select auth.uid()) = user_id);

revoke insert, update, delete on public.ai_search_log from anon, authenticated;
grant insert (user_id, course_id, question, source_count) on public.ai_search_log to authenticated;

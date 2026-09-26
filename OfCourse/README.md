# OfCourse

**Learn from the students who took it.**

OfCourse is a student-powered knowledge network for university courses. Every
course has a community where students share their **own** notes, explanations,
study guides, advice and experiences. AI then helps you search and understand
that student knowledge, always linking back to the posts and the students who
wrote them.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4
· shadcn/ui · Supabase (Postgres + pgvector, Auth, Storage) · OpenAI · Vercel

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables (`.env.local`)

| Variable | Required | Where it comes from |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Connect (Project URL) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase → Project Settings → API Keys (publishable; the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works) |
| `OPENAI_API_KEY` | for AI search | platform.openai.com → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | for AI search | Supabase → API Keys → **secret** key. Server-only; never share it |
| `NEXT_PUBLIC_SITE_URL` | in production | Your deployed URL, used in auth email links |
| `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `AI_MIN_SIMILARITY`, `AI_HOURLY_LIMIT` | no | Overrides (defaults in `src/lib/ai/config.ts`) |

`.env.local` is git-ignored. Without the two AI keys everything else works and
the AI panel says AI search isn't set up.

### Supabase setup (once per project)

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run each file in `supabase/migrations/` **in order**,
   then `supabase/seed.sql` (demo data; safe to re-run).
3. **Authentication → URL Configuration:** set the Site URL
   (`http://localhost:3000` locally) and add `<site-url>/auth/confirm` to the
   Redirect URLs.
4. **Authentication → Sign In / Providers → Email:** keep **Confirm email** on
   so signing up with a university email verifies the student.
5. Generate AI search embeddings for the seeded posts:

   ```bash
   npm run embed:posts            # skips posts that are already up to date
   ```

   (If you skip this, each course's posts are embedded on its first AI search.)

## Demo

Seeded data: Georgia Tech with **CS 1332** (24 posts), CS 2110 and MATH 1554,
30 fictional verified demo students (no passwords; nobody can sign in as them),
comments, up/down votes and course ratings. All content is original and
fictional, not real course material.

For the demo, use your own account and verify it with a `@gatech.edu` email
(sign up with it, or **Settings → University verification**), so your posts
show the verified badge.

**Golden path (2–3 min):** home page → search "CS 1332" → open c/cs1332 → Hot /
New / Top and the **Trees** filter → open a post → click the author → back to
CS 1332 → ask *"I'm struggling with AVL rotations. Can someone explain why they
work?"* → read the synthesis → click a source → open the contributor's profile.

## Features

- **Course communities** (`/c/cs1332`): join, Hot/New/Top, topic filters,
  keyword filter, course ratings (averages only), up/down votes, saves.
- **Posts:** types (discussion, study advice, notes, study guide, concept
  explanation), topics, semester, required academic-integrity confirmation,
  two-level comments, edit/delete your own posts and comments.
- **Profiles** (`/u/<username>`): contributions, courses, helpful votes, photo,
  university badge.
- **University verification:** the university is derived from an email the
  student proved they own via Supabase Auth. Clients can never set `verified`
  or `university_id` (column permissions + a guard trigger).
- **AI search ("Ask the student knowledge")**: course-scoped retrieval over
  student posts, then a short synthesis citing them.

## AI search architecture

```
post saved ──► embedding ──► post_embeddings (pgvector 1536, per course)
question ──► embedding ──► match_course_posts(course_id) ──► posts ≥ 0.5 similarity
         ──► OpenAI chat model ──► answer with [S1] citations ──► source cards
```

- Models: `text-embedding-3-small` (1536 dimensions, matching the
  `vector(1536)` column) and `gpt-5.4-mini`.
- Answers come only from the retrieved posts. If they don't cover the
  question, the answer says so and makes no general-knowledge claims; if no
  post is relevant, no AI call is made at all.
- Sources are the database records that were retrieved. The model only cites
  them by number; the app builds the links, drops unknown numbers and strips
  any URL the model writes.
- New/edited posts are re-embedded in the background only when their text
  changes. Signed-in students only; 30 questions per student per hour.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run embed:posts [-- <course-slug>]` | Generate AI search embeddings |
| `npm run db:push` · `npm run db:types` | Supabase CLI: push migrations · regenerate types |

## Project layout

```
src/
  app/(app)/        App shell: home, courses, c/[slug] (course + posts), u/[handle], saved, new, settings
  app/(auth)/       Sign in / sign up
  app/auth/confirm/ Supabase email link handler (also claims university verification)
  components/       UI (shadcn/ui in components/ui)
  lib/actions/      Server actions (posts, comments, votes, saves, ratings, profile, AI)
  lib/data/         Read queries
  lib/ai/           AI search: config, embeddings, retrieval, synthesis
  lib/supabase/     Browser, server, proxy and service-role clients
supabase/
  migrations/       Schema, RLS policies, functions (run in order)
  seed.sql          Demo data
scripts/
  embed-posts.ts    Embedding backfill
```

## Content policy

OfCourse is for students' own original work. Exams, unreleased exam questions,
answer keys, current assignment solutions, professor slides or study guides,
textbook PDFs, lecture recordings and other restricted materials are
prohibited. Every post requires an academic-integrity confirmation, stored in
`posts.integrity_attested_at` (required by the database).

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
   Supabase's built-in email sender is rate-limited (a few emails an hour); for
   real use, set up custom SMTP under **Authentication → Emails → SMTP Settings**.
5. **Authentication → Emails → Templates** (needs custom SMTP): put the code
   in the **Confirm signup**, **Magic Link**, **Change Email Address** and
   **Reset Password** templates. Link to `/verify` with the code filled in,
   never straight to a confirmation URL: university mail scanners open every
   link, which would use up the code. For example (Confirm signup):

   ```html
   <h2>Your OfCourse code: {{ .Token }}</h2>
   <p><a href="{{ .SiteURL }}/verify?mode=signup&email={{ .Email }}&code={{ .Token }}">Open OfCourse to finish</a></p>
   ```

   Use `mode=email` in Magic Link and `mode=email_change` in Change Email
   Address. Reset Password only needs the code.
6. Generate AI search embeddings for the seeded posts:

   ```bash
   npm run embed:posts            # skips posts that are already up to date
   ```

   (If you skip this, each course's posts are embedded on its first AI search.)

## Demo

Seeded data: Georgia Tech with **CS 1332** (27 posts), CS 2110 and MATH 1554,
30 fictional verified demo students (no passwords; nobody can sign in as them),
syllabus units, comments, helpful votes, course ratings and written reviews. All content is original and
fictional, not real course material.

For the demo, use your own account and verify it with a `@gatech.edu` email
(sign up with it, or **Settings → University verification**), so your posts
show the verified badge.

**Sign-up path:** sign up with a `@gatech.edu` email → type the 6-digit code
from the email → **Welcome** screen (intro + terms; "Agree and continue" unlocks
once the box is checked) → home.

**Golden path (2–3 min):** home page → search "CS 1332" → open the course (stat cards, **Course Reviews & Stats**) → **Resources & Topics** by unit → open a post
→ click the author → back to CS 1332 → ask *"I'm struggling with AVL rotations.
Can someone explain why they work?"* → read the synthesis → click a source → open
the contributor's profile.

## Features

- **Look and feel:** dark mode by default with a light/dark toggle in the
  header (remembered per browser), neutral colors, monochrome post-type badges.
- **Course pages** (`/c/cs1332`): title, university and student count; three
  color-coded stat cards (workload, difficulty, would take again: green →
  yellow → red); the **Ask the student knowledge** AI bar; three tabs,
  **Course Reviews & Stats** (rate the course; written reviews), **Study
  Threads & Advice** (Hot / New / Top) and **Resources & Topics** (by syllabus
  unit); and a **course syllabus** sidebar whose topics filter the resources.
  Posts can be upvoted (one per student) and saved.
- **Explore** (`/courses`): recommended classes with a reason for each
  (classmates from your courses, students in your major, ratings), then the
  full catalog for your university.
- **Comments:** replies collapse behind "Show N replies"; replying to a reply
  stays in the same thread with an @mention.
- **Posts:** types (discussion, study advice, notes, study guide, concept
  explanation, course review), topics, semester, required academic-integrity
  confirmation, two-level comments, edit/delete your own posts and comments.
- **Profiles** (`/u/<username>`): contributions, courses, helpful votes, photo,
  university badge.
- **Accounts:** sign in with username or email (usernames are resolved on
  the server with the service key, so emails are never exposed), forgot
  password by emailed code, log out from your profile. Names are capitalized
  at sign-up; majors come from a fixed, searchable list (`src/lib/majors.ts`,
  enforced by the `public.majors` table).
- **Verified students only:** anyone can read, but joining courses, posting,
  commenting, upvoting, rating and the AI need a university-verified
  student, and only in their own university's courses (the database enforces
  this with `public.can_participate()`). Unverified students see a prompt to
  verify everywhere; verified students see their own school's catalog.
- **Sign-up and onboarding:** after signing up, students enter the 6-digit code
  emailed to them (`/verify`), then see `/welcome`: a short intro and the
  OfCourse terms (`/terms`, text in `src/lib/terms.ts`). Nobody can use the app
  until they agree; the time they agreed is stored in
  `profiles.terms_accepted_at` (set only through the `accept_terms()` function).
- **University verification:** the university is derived from an email the
  student proved they own via Supabase Auth (the sign-up code, or a code sent
  from **Settings**; the emailed link also works). Clients can never set
  `verified` or `university_id` (column permissions + a guard trigger).
- **Ask AI tab** (`/c/cs1332?tab=ask`): course-scoped retrieval over every
  kind of student post (reviews, study threads with their replies, and
  resources), plus the course's rating averages, then a short synthesis citing
  the posts. Chats are saved per student and
  course (`ai_conversations`, `ai_messages`, private to their owner): follow-ups
  remember the last 3 turns, and students can reopen past chats, start a new
  one or delete one.

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
- Follow-ups: the last 3 question/answer pairs are sent as context (old
  answers without their citations), and the previous question is added to the
  search text so "what about double rotations?" still finds AVL posts. Only the
  newest sources can be cited.
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

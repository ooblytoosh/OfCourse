# OfCourse

**Learn from the students who took it.**

OfCourse is a student-powered knowledge network for university courses. Every
course gets a community where students share their own notes, study guides,
explanations, advice and experiences.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui ·
Supabase (Postgres, Auth, Storage) · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev                  # http://localhost:3000
```

The app runs without Supabase keys. Sign-in is disabled and a setup notice
is shown until they're provided.

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Put the project URL and publishable key in `.env.local`.
3. Apply the schema and demo data. In the **SQL editor**, run each file in
   `supabase/migrations/` in order, then `supabase/seed.sql`. (With the CLI:
   `npx supabase link --project-ref <ref>`, `npm run db:push`, then run
   `seed.sql` in the SQL editor.) The seed is safe to re-run.
4. In **Authentication → URL Configuration**, set the Site URL
   (`http://localhost:3000` locally) and add `<site-url>/auth/confirm` to the
   Redirect URLs.
5. Optional: regenerate DB types after schema changes with `npm run db:types`.

### University verification

Students are "university verified" once they prove they control an email
address at a university's domain (`universities.domain`, e.g. `gatech.edu`).
The proof always comes from Supabase Auth:

- **Confirm email ON (recommended):** signing up with a `@gatech.edu` address
  and clicking the confirmation link verifies the student.
- **Confirm email OFF:** new accounts sign in right away but start unverified;
  they verify from **Settings → University verification**, which emails a
  sign-in link.

Clients can never set `verified` or `university_id` themselves (column
permissions + a guard trigger). Supported universities (and their email
domains) live in the `universities` table; `seed.sql` adds 15, and students at
other schools can still sign up unverified. See
`supabase/migrations/20260927000000_profiles_verification.sql`. Supabase's
built-in email sender is rate-limited (a few emails per hour); add custom SMTP
under Authentication → Emails for anything beyond a demo.

## Scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server                               |
| `npm run build`     | Production build                                   |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | TypeScript check                                   |
| `npm run db:push`   | Push migrations to the linked Supabase project     |
| `npm run db:types`  | Regenerate `src/lib/database.types.ts`             |
| `npm run embed:posts` | Generate AI search embeddings for posts          |

## Project layout

```
src/
  app/
    (app)/            App shell (header + sidebar): home, courses, saved, new, settings, guidelines
      c/[slug]/       Course community feed (/c/cs1332) and post pages (/c/cs1332/posts/<id>)
      u/[handle]/     Student profiles (/u/alexchen); /profile redirects to your own
    (auth)/           Sign in / sign up pages and auth server actions
    auth/confirm/     Handles links from Supabase auth emails
  components/
    layout/           Header, nav, logo
    ui/               shadcn/ui components
  lib/
    actions/          Server actions: vote, save, join, comment, create post, profile, verification
    data/             Read queries for courses, posts, comments, profiles
    ai/               AI search: config, embeddings, retrieval + synthesis
    supabase/         Browser, server, proxy and service-role Supabase clients
    auth.ts           getCurrentUser / requireUser
    content-policy.ts Allowed post types, prohibited content, integrity attestation
    database.types.ts Typed schema
  proxy.ts            Refreshes the Supabase session on each request
supabase/
  migrations/         SQL schema
  seed.sql            Georgia Tech courses + fictional demo students, posts, comments and votes
```

## Votes and course ratings

Posts take one up- or downvote per student (`votes.value` is 1 or -1; a
trigger keeps `posts.vote_score` in sync). Students rate a course once
(workload, difficulty, would take again) in `course_ratings`; individual
ratings are private and the `course_rating_stats` view exposes only averages.

## AI search (student knowledge)

Every course page has **Ask the student knowledge**: a question is answered
only from that course's student posts, with links to the posts it used.

```
post saved ──► embedding (OpenAI) ──► post_embeddings (pgvector, 1536 dims)
question ──► embedding ──► match_course_posts(course_id) ──► top posts
         ──► OpenAI chat model ──► answer with [S1] citations ──► source cards
```

- Models live in `src/lib/ai/config.ts`: `text-embedding-3-small` (1536
  dimensions, matching the `vector(1536)` column) and `gpt-5.4-mini` for
  answers. Override with `OPENAI_EMBEDDING_MODEL` / `OPENAI_CHAT_MODEL`.
- Sources are always the database records that were retrieved. The model only
  cites them by number; the app builds the links, drops unknown numbers and
  strips any URL the model writes.
- New and edited posts are embedded in the background after saving (only when
  their text changed). Posts without an embedding are indexed the first time
  someone searches their course.
- Signed-in students only; 30 questions per student per hour
  (`AI_HOURLY_LIMIT`). Keys stay on the server.

**Setup:** add `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to
`.env.local` (see `.env.example`), then embed existing posts:

```bash
npm run embed:posts            # all posts (skips ones already up to date)
npm run embed:posts -- cs1332  # one course
```

## Profile photos

Photos upload to the public `avatars` Storage bucket (created by the
migrations) at `avatars/<user id>/…`. Storage policies only let students write
inside their own folder; uploads are limited to PNG/JPG/WebP/GIF up to 2 MB.

## Demo data

`supabase/seed.sql` creates 30 fictional students (on the reserved
`ofcourse.example` domain, with no passwords, shown as verified Georgia Tech
students for the demo) and original demo posts,
comments and votes: 22 posts in CS 1332, plus a few in CS 2110 and MATH 1554.
Course stats in the sidebar are averages of student ratings (the demo students
rate the courses they're in). None of it is copied from real course materials.

## Content policy

OfCourse is for students' **own** original work. Exams, unreleased exam
questions, answer keys, current assignment solutions, professor slides or
study guides, textbook PDFs, lecture recordings and other restricted materials
are prohibited. Every post must store an academic-integrity attestation
(`posts.integrity_attested_at` is required by the database).

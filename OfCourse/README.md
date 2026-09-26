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

Tip for hackathon speed: turning off **Confirm email** under
Authentication → Providers → Email lets new accounts sign in immediately.

## Scripts

| Command             | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server                               |
| `npm run build`     | Production build                                   |
| `npm run lint`      | ESLint                                             |
| `npm run typecheck` | TypeScript check                                   |
| `npm run db:push`   | Push migrations to the linked Supabase project     |
| `npm run db:types`  | Regenerate `src/lib/database.types.ts`             |

## Project layout

```
src/
  app/
    (app)/            App shell (header + sidebar): home, courses, saved, new, profile, guidelines
      c/[slug]/       Course community feed (/c/cs1332) and post pages (/c/cs1332/posts/<id>)
    (auth)/           Sign in / sign up pages and auth server actions
    auth/confirm/     Handles links from Supabase auth emails
  components/
    layout/           Header, nav, logo
    ui/               shadcn/ui components
  lib/
    actions/          Server actions: vote, save, join, comment, create post
    data/             Read queries for courses, posts, comments
    supabase/         Browser, server and proxy Supabase clients
    auth.ts           getCurrentUser / requireUser
    content-policy.ts Allowed post types, prohibited content, integrity attestation
    database.types.ts Typed schema
  proxy.ts            Refreshes the Supabase session on each request
supabase/
  migrations/         SQL schema
  seed.sql            Georgia Tech courses + fictional demo students, posts, comments and votes
```

## Demo data

`supabase/seed.sql` creates 30 fictional students (on the reserved
`ofcourse.example` domain, with no passwords) and original demo posts,
comments and votes: 22 posts in CS 1332, plus a few in CS 2110 and MATH 1554.
Course stats are marked as demo data in the UI. None of it is copied from real
course materials.

## Content policy

OfCourse is for students' **own** original work. Exams, unreleased exam
questions, answer keys, current assignment solutions, professor slides or
study guides, textbook PDFs, lecture recordings and other restricted materials
are prohibited. Every post must store an academic-integrity attestation
(`posts.integrity_attested_at` is required by the database).

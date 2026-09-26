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
3. Apply the schema, using either:
   - **SQL editor:** paste and run
     `supabase/migrations/20260926000000_initial_schema.sql`, then
     `supabase/seed.sql`.
   - **CLI:** `npx supabase login`, `npx supabase link --project-ref <ref>`,
     then `npm run db:push` (run `seed.sql` in the SQL editor afterwards).
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
    (auth)/           Sign in / sign up pages and auth server actions
    auth/confirm/     Handles links from Supabase auth emails
  components/
    layout/           Header, nav, logo
    ui/               shadcn/ui components
  lib/
    supabase/         Browser, server and proxy Supabase clients
    auth.ts           getCurrentUser / requireUser
    content-policy.ts Allowed post types, prohibited content, integrity attestation
    database.types.ts Typed schema
  proxy.ts            Refreshes the Supabase session on each request
supabase/
  migrations/         SQL schema
  seed.sql            Georgia Tech + sample courses
```

## Content policy

OfCourse is for students' **own** original work. Exams, unreleased exam
questions, answer keys, current assignment solutions, professor slides or
study guides, textbook PDFs, lecture recordings and other restricted materials
are prohibited. Every post must store an academic-integrity attestation
(`posts.integrity_attested_at` is required by the database).

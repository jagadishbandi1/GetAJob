<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GetAJobFaster Agent Guide

Agent entrypoint for GetAJobFaster. Read `README.md` first for what the product
does and how to run it.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Framer Motion ·
Playwright · Anthropic SDK · Neon serverless Postgres.

## Scripts

- `npm run dev` — dev server on http://localhost:4000
- `npm run build` — production build
- `npm run lint` — eslint (must be clean before a PR)

## Layout

- `app/page.tsx`, `app/knowledge/page.tsx` — the two pages; both are thin and
  compose components.
- `components/home/`, `components/knowledge/`, `components/layout/`,
  `components/effects/` — UI. `AppProvider.tsx` holds shared client state.
- `hooks/` — data hooks (`useProfile`, `useApplications`) and shared `types.ts`.
- `app/api/*` — route handlers: `apply`, `upload`, `parse-resume`, `profile`,
  `applications`, `documents`, `training`, `health`, and Gmail
  (`auth/google`, `auth/callback`, `gmail`).
- `lib/autofiller.ts` — the Playwright autofill engine (the core of the app).
- `lib/db.ts` — Neon tagged SQL plus idempotent `initDb()` schema/migrations.
- `lib/demo.ts` — `isDemo()` plus sample data for the read-only Vercel demo.
- `lib/rate-limit.ts` — in-memory limiter for the expensive routes.

## Invariants

- **Never submit an application.** `lib/autofiller.ts` fills forms and stops;
  any change that could click submit/apply/continue is a bug.
- **Demo mode stays safe.** On Vercel (`isDemo()`), routes must serve sample
  data, persist nothing, and spend no Anthropic credits. Every new route that
  writes or calls Claude needs a demo guard.
- **Postgres only.** `lib/db.ts` uses `@neondatabase/serverless` tagged SQL —
  do not reintroduce SQLite/better-sqlite3, and keep values interpolated
  through tagged templates so they stay parameterized.
- **Never expose Gmail tokens.** `/api/profile` selects safe columns only and
  reports Gmail state as a boolean.
- Schema changes go in `initDb()` as `CREATE TABLE IF NOT EXISTS` /
  `ADD COLUMN IF NOT EXISTS` so they stay idempotent.

## Engineering Rules

- Keep changes small and scoped; prefer Tailwind classes over inline styles.
- Don't add broad abstractions ahead of a second real use.
- Verify frontend changes in the browser with the dev server running.
- For Next.js API/framework questions, read the local docs in
  `node_modules/next/dist/docs/` first.
- Don't commit build artifacts (`.next/`, `*.tsbuildinfo`), OS junk
  (`.DS_Store`), or one-off debug scripts.

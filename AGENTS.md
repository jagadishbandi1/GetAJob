<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# GetAJobFaster Agent Guide

Agent entrypoint for GetAJobFaster.

Current repo folder: `/Users/jagdishbandi/claude-projects/job-autofiller`.

## Read First

1. `../AI_SYNC.md` — coordination, active owner, handoff notes.
2. `../AGENTS.md` — user/project memory written for Codex-style agents.
3. `../memory/projects/getajobfaster.md` — compact product source of truth.
4. `../getajobfaster-build-prompt.md` — detailed phase plan.
5. `CLAUDE.md` — Claude-facing summary, useful for shared context.

## Repo Facts

- Stack: Next.js 16.2.2, React 19.2.4, Tailwind 4, Framer Motion, Playwright, Anthropic SDK, Neon serverless Postgres.
- Scripts: `npm run dev` serves on port 4000, `npm run build`, `npm run lint`.
- Database: `lib/db.ts` uses `@neondatabase/serverless` tagged SQL. Do not add SQLite or better-sqlite3 back.
- Auth/email: Gmail routes already exist and should be preserved.
- Current git noise: `.DS_Store` is untracked; do not touch it unless the user asks.

## Active Phase

Phase 1 from `../getajobfaster-build-prompt.md` is still active:

- Remove the accounts/password feature.
- Delete stale SQLite database artifacts from the repo.
- Generalize `.gitignore` database ignores.
- Verify build/lint after cleanup when feasible.

## Engineering Rules

- Check `../AI_SYNC.md` before edits and update it before handoff.
- Keep changes small and phase-aligned.
- Preserve Neon SQL syntax and Gmail routes.
- Prefer Tailwind classes over inline styles during UI refactors.
- Do not introduce broad abstractions before the component split makes them useful.
- For frontend changes, verify in browser screenshots after the dev server is running.
- For Next.js API/framework questions, read local Next docs in `node_modules/next/dist/docs/` first.

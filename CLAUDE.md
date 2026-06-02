# GetAJobFaster Claude Guide

Claude Code entrypoint for GetAJobFaster.

Current repo folder: `/Users/jagdishbandi/claude-projects/job-autofiller`.

## Read First

1. `../AI_SYNC.md` — coordination, active owner, handoff notes.
2. `../CLAUDE.md` — user/project memory written for Claude.
3. `../memory/projects/getajobfaster.md` — compact product source of truth.
4. `../getajobfaster-build-prompt.md` — detailed phase plan.
5. `AGENTS.md` — repo-specific engineering rules.

## Current Mission

GetAJobFaster is an AI-powered application autofiller for job sites and a portfolio piece. The active work is a major revamp: remove unsafe account/password storage, keep Neon Postgres and Gmail integration intact, then rebuild the UI into a dark, editorial, sage-monochrome Next.js app.

## Current Repo State

- Next.js 16.2.2, React 19.2.4, Tailwind 4, Framer Motion, Playwright, Anthropic SDK, Neon serverless Postgres.
- Dev server uses `npm run dev` on `localhost:4000`.
- DB integration is Neon via `@neondatabase/serverless`; do not reintroduce SQLite/better-sqlite3.
- Gmail integration exists under `/api/auth/google`, `/api/auth/callback`, and `/api/gmail`.
- Main UI is still monolithic: `app/page.tsx` is about 1177 lines.
- Accounts/password feature still exists and is the first cleanup target.

## Design Truth

- Dark editorial portfolio feel.
- Sage monochrome palette: `#0a0a0a`, `#141414`, `#6b8f6b`, `#8aad8c`, `#c8dcc8`, `#2d3a2e`.
- Lowercase, direct, confident copy.
- Source Serif 4 for headlines, Geist Mono for body/UI.
- Locked interaction set: custom cursor, magnetic buttons, geometric wireframe background, grain overlay, hover glow, scroll reveal, mixed serif/sans headings, scroll progress bar.

## Collaboration Rules

- Claim your active area in `../AI_SYNC.md` before editing.
- Update `../AI_SYNC.md` before handing off to Codex or the user.
- Keep Claude strong where it shines: architecture critique, design/product reasoning, phase planning, copy refinement, review.
- Leave implementation/test/build loops clearly handed off when Codex is a better fit.
- Ask before changing product direction, visual identity, data model, or deployment assumptions.

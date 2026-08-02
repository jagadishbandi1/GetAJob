# GetAJobFaster

An AI job-application autofiller. Paste a job posting URL and it opens a real
browser, reads the application form, fills it with your profile, attaches your
resume, and stops so you can review and submit. It never submits for you.

Live demo: https://getajobfaster.vercel.app (read-only showcase — the real
autofiller only runs locally; see "Why local" below).

## Run a test in 5 minutes

You need three things: Node 18+, a Postgres database (a free
[Neon](https://neon.tech) project works), and an
[Anthropic API key](https://console.anthropic.com/).

```bash
# 1. clone + install
git clone https://github.com/jagadishbandi1/GetAJob.git
cd GetAJob
npm install

# 2. install the browser Playwright drives
npx playwright install chromium

# 3. set up env
cp .env.example .env.local
# then edit .env.local and fill in:
#   DATABASE_URL      — your Neon/Postgres connection string
#   ANTHROPIC_API_KEY — your Anthropic key
# (Gmail vars are optional — leave them blank)

# 4. run
npm run dev
```

Open http://localhost:4000 and try it:

1. Go to **knowledge** (top nav). Drag in a resume (`.pdf`, `.txt`, `.md`,
   `.doc`, `.docx`). Claude extracts your details; review them and hit
   **confirm & save**.
2. Go back to **home**. Paste a real job URL into the box and click
   **apply now**. Good ones to test with are Greenhouse, Lever, or Ashby
   postings, e.g. a `job-boards.greenhouse.io/.../jobs/...` application page.
3. A Chromium window opens and fills the form — name, email, phone, links,
   a tailored cover letter, dropdowns, and your resume file. It stops at the
   filled form. **Review it and submit yourself.** The window stays open until
   you close it.

The live progress log streams into the page as it works.

## What it does and doesn't do

- **Fills, never submits.** It stops at the completed form. You review and click
  submit. There is a hard guard against clicking any submit/apply/continue
  control.
- **Works on** inline application forms and forms behind a single "Apply" button
  — Greenhouse, Lever, Ashby, and similar. It dismisses cookie banners, waits
  for client-rendered forms, looks inside embedded iframes, handles text fields,
  dropdowns/comboboxes, radio/checkbox groups, and file uploads.
- **Does not work on** flows that require creating an account or logging in, or
  that use CAPTCHAs — e.g. most Workday postings. That is an inherent barrier,
  not a bug; the tool will fill what it can reach and tell you when it can't.

## Why local

The autofiller drives a real browser with Playwright, which can't run on a
serverless host like Vercel. So the deployed site runs in **demo mode**: it
serves sample data, accepts no writes, and spends no API credits — it's a safe
public showcase. All real functionality (your data, the actual autofill) runs
on your machine against your own database and API key.

## Optional: Gmail auto-status

If you set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (a Google OAuth client
with the `gmail.readonly` scope and redirect URI
`http://localhost:4000/api/auth/callback`), the knowledge page gains a
**connect gmail** button. Once connected, "sync applications" reads recent
job-related emails and moves matching applications through the tracker
(applied -> interviewing -> offer/rejected), forward-only.

## Stack

Next.js 16 (App Router) - React 19 - TypeScript - Tailwind 4 - Playwright -
Anthropic SDK (Claude) - Neon serverless Postgres. Dev server runs on port 4000.

## Scripts

```bash
npm run dev     # start the dev server on http://localhost:4000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

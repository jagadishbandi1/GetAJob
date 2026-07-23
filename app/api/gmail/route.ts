import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isDemo } from '@/lib/demo';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface GmailProfile {
  gmail_token?: string;
  gmail_refresh_token?: string;
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessageSummary {
  id: string;
}

interface GmailListResponse {
  messages?: GmailMessageSummary[];
}

interface GmailMessageResponse {
  payload?: { headers?: GmailHeader[] };
  snippet?: string;
}

interface ExtractedApplicationEmail {
  is_job_related?: boolean;
  company?: string;
  job_title?: string;
  status?: string;
  job_url?: string;
}

interface ExistingApplication {
  id: number;
  status?: string;
}

// pipeline progression rank. auto-status only ever moves an application
// forward (or to a terminal state), never backward — a stray "we received
// your application" email must not undo an interview/offer/rejection.
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  running: 0,
  review: 0,
  done: 1,
  failed: 1,
  demo: 1,
  interviewing: 2,
  offer: 3,
  rejected: 3,
};

function rankOf(status: string | undefined): number {
  return status ? STATUS_RANK[status] ?? 0 : 0;
}

// pull a comparable domain from a `From` header ("Team <jobs@lever.co>").
function senderDomain(from: string): string {
  const at = from.match(/@([A-Za-z0-9.-]+)/);
  if (!at) return '';
  const parts = at[1].toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  return parts.slice(-2).join('.');
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch { return null; }
}

export async function POST() {
  if (isDemo()) return NextResponse.json({ ok: false, error: 'gmail sync is disabled in the demo — run locally.' });
  const sql = getDb();
  const rows = await sql`SELECT gmail_token, gmail_refresh_token FROM profile WHERE id = 1`;
  const profile = rows[0] as GmailProfile | undefined;

  if (!profile || !profile.gmail_token) {
    return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 });
  }

  let token = profile.gmail_token;

  // Search for job-related emails
  const searchQuery = encodeURIComponent(
    'subject:(application OR "job offer" OR interview OR "we received" OR "thank you for applying") newer_than:30d'
  );

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=20`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (listRes.status === 401) {
    // Try refresh
    if (profile.gmail_refresh_token) {
      const newToken = await refreshAccessToken(profile.gmail_refresh_token);
      if (newToken) {
        token = newToken;
        await sql`UPDATE profile SET gmail_token = ${newToken} WHERE id = 1`;
      } else {
        return NextResponse.json({ error: 'Token expired, reconnect Gmail' }, { status: 401 });
      }
    }
  }

  const listData = await listRes.json() as GmailListResponse;
  const messages = listData.messages || [];
  let synced = 0;

  for (const msg of messages.slice(0, 10)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgRes.json() as GmailMessageResponse;

      // Extract subject and snippet
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h) => h.name === 'Subject')?.value || '';
      const from = headers.find((h) => h.name === 'From')?.value || '';
      const snippet = msgData.snippet || '';

      // Use Claude to classify and extract
      const aiRes = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Analyze this email about a job application. Return ONLY a JSON object with keys:
- is_job_related: boolean
- company: string (company name, "" if unknown)
- job_title: string (role, "" if unknown)
- status: one of "done" | "interviewing" | "offer" | "rejected" | "" (based on email content)
- job_url: string (any job URL in the email, "" if none)

Email:
From: ${from}
Subject: ${subject}
Body: ${snippet}`,
        }],
      });

      const raw = aiRes.content[0].type === 'text' ? aiRes.content[0].text : '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;

      const info = JSON.parse(match[0]) as ExtractedApplicationEmail;
      if (!info.is_job_related || !info.company) continue;

      // Match an existing application by company name (case-insensitive) or by
      // the sender's domain appearing in the stored job_url. Most-recent wins.
      const domain = senderDomain(from);
      const existing = await sql`
        SELECT id, status FROM applications
        WHERE company ILIKE ${info.company}
           OR (${domain} <> '' AND job_url ILIKE ${'%' + domain + '%'})
        ORDER BY applied_at DESC
        LIMIT 1
      ` as ExistingApplication[];

      if (existing.length > 0) {
        // Only apply a status the email is confident about, and only if it
        // moves the application forward — never downgrade a further-along stage.
        if (info.status && rankOf(info.status) > rankOf(existing[0].status)) {
          await sql`UPDATE applications SET status = ${info.status} WHERE id = ${existing[0].id}`;
          synced++;
        }
      } else {
        // No match: preserve the original import behavior.
        await sql`
          INSERT INTO applications (job_url, company, job_title, status, source, log)
          VALUES (${info.job_url || ''}, ${info.company}, ${info.job_title || ''}, ${info.status || 'done'}, 'gmail', ${`Imported from Gmail: ${subject}`})
        `;
        synced++;
      }
    } catch { continue; }
  }

  return NextResponse.json({ ok: true, synced, total: messages.length });
}

// Check connection status
export async function GET() {
  if (isDemo()) return NextResponse.json({ connected: false });
  const sql = getDb();
  const rows = await sql`SELECT gmail_token FROM profile WHERE id = 1`;
  const profile = rows[0] as GmailProfile | undefined;
  return NextResponse.json({ connected: !!profile?.gmail_token });
}

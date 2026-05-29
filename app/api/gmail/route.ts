import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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
  const sql = getDb();
  const [profile] = await sql`SELECT gmail_token, gmail_refresh_token FROM profile WHERE id = 1` as any[];

  if (!profile?.gmail_token) {
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

  const listData = await listRes.json();
  const messages = listData.messages || [];
  let synced = 0;

  for (const msg of messages.slice(0, 10)) {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgRes.json();

      // Extract subject and snippet
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
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

      const info = JSON.parse(match[0]);
      if (!info.is_job_related || !info.company) continue;

      // Check if we already have this application
      const existing = await sql`
        SELECT id FROM applications WHERE company = ${info.company}
        AND (job_title = ${info.job_title} OR job_title = '')
        LIMIT 1
      ` as any[];

      if (existing.length > 0 && info.status) {
        await sql`UPDATE applications SET status = ${info.status} WHERE id = ${existing[0].id}`;
      } else if (!existing.length) {
        await sql`
          INSERT INTO applications (job_url, company, job_title, status, source, log)
          VALUES (${info.job_url || ''}, ${info.company}, ${info.job_title || ''}, ${info.status || 'done'}, 'gmail', ${`Imported from Gmail: ${subject}`})
        `;
      }
      synced++;
    } catch { continue; }
  }

  return NextResponse.json({ ok: true, synced, total: messages.length });
}

// Check connection status
export async function GET() {
  const sql = getDb();
  const [profile] = await sql`SELECT gmail_token FROM profile WHERE id = 1` as any[];
  return NextResponse.json({ connected: !!profile?.gmail_token });
}

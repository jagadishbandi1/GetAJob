import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isDemo } from '@/lib/demo';

const VALID_STATUSES = ['pending', 'running', 'done', 'failed', 'interviewing', 'offer', 'rejected'];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  // Prod demo: don't expose real applications.
  if (isDemo()) return NextResponse.json(id ? null : []);
  const sql = getDb();
  await initDb();

  if (id) {
    const rows = await sql`SELECT * FROM applications WHERE id = ${id}`;
    const app = rows[0] ?? null;
    return NextResponse.json(app);
  }

  const apps = await sql`SELECT * FROM applications ORDER BY applied_at DESC`;
  return NextResponse.json(apps);
}

// Manual application entry
export async function POST(req: NextRequest) {
  if (isDemo()) return NextResponse.json({ ok: true, demo: true });
  const sql = getDb();
  await initDb();
  const body = await req.json();
  const { job_url, company, job_title, location, compensation, status } = body;

  if (!job_url) return NextResponse.json({ error: 'job_url is required' }, { status: 400 });
  const safeStatus = VALID_STATUSES.includes(status) ? status : 'done';

  const rows = await sql`
    INSERT INTO applications (job_url, company, job_title, location, compensation, status, source, log)
    VALUES (${job_url}, ${company || ''}, ${job_title || ''}, ${location || ''}, ${compensation || ''}, ${safeStatus}, 'manual', 'Added manually.')
    RETURNING id
  `;
  const row = rows[0] ?? null;
  if (!row) return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  return NextResponse.json({ ok: true, id: row.id });
}

// Status update
export async function PATCH(req: NextRequest) {
  if (isDemo()) return NextResponse.json({ ok: true, demo: true });
  const sql = getDb();
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await sql`UPDATE applications SET status = ${status} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (isDemo()) return NextResponse.json({ ok: true, demo: true });
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await sql`DELETE FROM applications WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

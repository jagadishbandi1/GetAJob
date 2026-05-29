import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

const VALID_STATUSES = ['pending', 'running', 'done', 'failed', 'interviewing', 'offer', 'rejected'];

export async function GET(req: NextRequest) {
  const sql = getDb();
  await initDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');

  if (id) {
    const [app] = await sql`SELECT * FROM applications WHERE id = ${id}`;
    return NextResponse.json(app ?? null);
  }

  const apps = await sql`SELECT * FROM applications ORDER BY applied_at DESC`;
  return NextResponse.json(apps);
}

// Manual application entry
export async function POST(req: NextRequest) {
  const sql = getDb();
  await initDb();
  const body = await req.json();
  const { job_url, company, job_title, location, compensation, status } = body;

  if (!job_url) return NextResponse.json({ error: 'job_url is required' }, { status: 400 });
  const safeStatus = VALID_STATUSES.includes(status) ? status : 'done';

  const [row] = await sql`
    INSERT INTO applications (job_url, company, job_title, location, compensation, status, source, log)
    VALUES (${job_url}, ${company || ''}, ${job_title || ''}, ${location || ''}, ${compensation || ''}, ${safeStatus}, 'manual', 'Added manually.')
    RETURNING id
  `;
  return NextResponse.json({ ok: true, id: row.id });
}

// Status update
export async function PATCH(req: NextRequest) {
  const sql = getDb();
  const body = await req.json();
  const { id, status } = body;

  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  await sql`UPDATE applications SET status = ${status} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await sql`DELETE FROM applications WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

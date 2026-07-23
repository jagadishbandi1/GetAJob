import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { isDemo, DEMO_PROFILE, DEMO_RULES } from '@/lib/demo';

export async function GET() {
  // On prod, never expose real data — serve sample data instead.
  if (isDemo()) return NextResponse.json({ profile: DEMO_PROFILE, rules: DEMO_RULES });
  const sql = getDb();
  await initDb();
  // Never expose gmail_token / gmail_refresh_token over the public API — select
  // only safe columns and surface Gmail state as a boolean computed in SQL.
  const rows = await sql`
    SELECT id, full_name, email, phone, location, linkedin, website,
           resume_text, free_context, resume_file_name,
           (gmail_token IS NOT NULL AND gmail_token <> '') AS gmail_connected
    FROM profile WHERE id = 1
  `;
  const profile = rows[0] ?? null;
  const rules = await sql`SELECT * FROM context_rules ORDER BY created_at DESC`;
  return NextResponse.json({ profile, rules });
}

export async function POST(req: NextRequest) {
  // Prod is a read-only demo — accept the request but don't persist anything.
  if (isDemo()) return NextResponse.json({ ok: true, demo: true });
  const sql = getDb();
  await initDb();
  const body = await req.json();
  const { type } = body;

  if (type === 'profile') {
    const { full_name, email, phone, location, linkedin, website, resume_text, free_context, resume_file_name } = body;
    // When the resume is being cleared (empty name + empty text), also drop the
    // stored file name/blob so a reset fully wipes it. Normal saves don't send
    // an empty pair, so the uploaded file is preserved.
    if (resume_file_name === '' && (resume_text === '' || resume_text == null)) {
      await sql`UPDATE profile SET resume_file_name='', resume_file_data='', resume_file_type='' WHERE id=1`;
    }
    await sql`
      UPDATE profile SET
        full_name=${full_name}, email=${email}, phone=${phone},
        location=${location}, linkedin=${linkedin}, website=${website},
        resume_text=${resume_text}, free_context=${free_context},
        updated_at=${new Date().toISOString()}
      WHERE id=1
    `;
    return NextResponse.json({ ok: true });
  }

  if (type === 'rule') {
    const { trigger_keyword, response } = body;
    await sql`INSERT INTO context_rules (trigger_keyword, response) VALUES (${trigger_keyword}, ${response})`;
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (isDemo()) return NextResponse.json({ ok: true, demo: true });
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (type === 'rule' && id) {
    await sql`DELETE FROM context_rules WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

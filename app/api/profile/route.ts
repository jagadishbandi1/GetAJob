import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
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
  const sql = getDb();
  await initDb();
  const body = await req.json();
  const { type } = body;

  if (type === 'profile') {
    const { full_name, email, phone, location, linkedin, website, resume_text, free_context } = body;
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

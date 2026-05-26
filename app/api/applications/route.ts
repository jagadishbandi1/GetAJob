import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

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

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await sql`DELETE FROM applications WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

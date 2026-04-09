import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');

  if (id) {
    const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    return NextResponse.json(app);
  }

  const apps = db.prepare('SELECT * FROM applications ORDER BY applied_at DESC').all();
  return NextResponse.json(apps);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

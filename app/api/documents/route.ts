import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const docs = db.prepare('SELECT id, name, file_type, created_at, substr(content,1,100) as preview FROM documents ORDER BY created_at DESC').all();
  return NextResponse.json(docs);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (id) db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}

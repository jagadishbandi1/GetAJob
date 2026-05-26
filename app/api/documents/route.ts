import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  await initDb();
  const docs = await sql`
    SELECT id, name, file_type, created_at, substr(content, 1, 100) as preview
    FROM documents ORDER BY created_at DESC
  `;
  return NextResponse.json(docs);
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (id) await sql`DELETE FROM documents WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

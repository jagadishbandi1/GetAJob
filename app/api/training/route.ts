import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  await initDb();
  const examples = await sql`SELECT * FROM training_examples ORDER BY created_at DESC`;
  return NextResponse.json(examples);
}

export async function DELETE(req: NextRequest) {
  const sql = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (id) {
    await sql`DELETE FROM training_examples WHERE id = ${id}`;
  } else {
    await sql`DELETE FROM training_examples`;
  }
  return NextResponse.json({ ok: true });
}

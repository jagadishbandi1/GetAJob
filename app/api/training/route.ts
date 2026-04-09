import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const examples = db.prepare('SELECT * FROM training_examples ORDER BY created_at DESC').all();
  return NextResponse.json(examples);
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (id) {
    db.prepare('DELETE FROM training_examples WHERE id = ?').run(id);
  } else {
    db.prepare('DELETE FROM training_examples').run();
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  const rules = db.prepare('SELECT * FROM context_rules ORDER BY created_at DESC').all();
  const accounts = db.prepare('SELECT id, platform, email, created_at FROM accounts').all();
  return NextResponse.json({ profile, rules, accounts });
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { type } = body;

  if (type === 'profile') {
    const { full_name, email, phone, location, linkedin, website, resume_text, free_context } = body;
    db.prepare(`
      UPDATE profile SET full_name=?, email=?, phone=?, location=?, linkedin=?, website=?, resume_text=?, free_context=?, updated_at=datetime('now')
      WHERE id=1
    `).run(full_name, email, phone, location, linkedin, website, resume_text, free_context);
    return NextResponse.json({ ok: true });
  }

  if (type === 'rule') {
    const { trigger_keyword, response } = body;
    db.prepare('INSERT INTO context_rules (trigger_keyword, response) VALUES (?, ?)').run(trigger_keyword, response);
    return NextResponse.json({ ok: true });
  }

  if (type === 'account') {
    const { platform, email, password } = body;
    db.prepare('INSERT INTO accounts (platform, email, password) VALUES (?, ?, ?)').run(platform, email, password);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const db = getDb();
  const { searchParams } = req.nextUrl;
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  if (type === 'rule' && id) {
    db.prepare('DELETE FROM context_rules WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  }

  if (type === 'account' && id) {
    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

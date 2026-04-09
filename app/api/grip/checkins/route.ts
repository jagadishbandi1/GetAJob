import { getDb } from '@/lib/grip-db';

export async function GET() {
  const db = getDb();
  // Last 14 days of check-ins
  const checkIns = db.prepare(
    "SELECT * FROM check_ins WHERE date >= date('now', '-14 days') ORDER BY date DESC"
  ).all();
  const todayCheckIn = db.prepare("SELECT * FROM check_ins WHERE date = date('now') LIMIT 1").get();
  return Response.json({ checkIns, todayCheckIn: todayCheckIn ?? null });
}

export async function POST(request: Request) {
  const db = getDb();
  const { score, note } = await request.json();

  if (!score || score < 1 || score > 5) {
    return Response.json({ error: 'score must be 1–5' }, { status: 400 });
  }

  // Upsert: delete today's if exists, then insert
  db.prepare("DELETE FROM check_ins WHERE date = date('now')").run();
  const result = db.prepare(
    'INSERT INTO check_ins (score, note) VALUES (?, ?)'
  ).run(score, note ?? null);

  const checkIn = db.prepare('SELECT * FROM check_ins WHERE id = ?').get(result.lastInsertRowid);
  return Response.json({ checkIn }, { status: 201 });
}

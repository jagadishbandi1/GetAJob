import { getDb } from '@/lib/grip-db';

export async function GET() {
  const db = getDb();
  const nudges = db.prepare(`
    SELECT n.*, g.title as goal_title, g.emoji as goal_emoji, g.color as goal_color
    FROM nudges n
    JOIN goals g ON g.id = n.goal_id
    ORDER BY n.time_of_day ASC
  `).all();
  return Response.json({ nudges });
}

export async function POST(request: Request) {
  const db = getDb();
  const { goal_id, label, time_of_day } = await request.json();

  if (!goal_id || !label || !time_of_day) {
    return Response.json({ error: 'goal_id, label, and time_of_day required' }, { status: 400 });
  }

  const result = db.prepare(
    'INSERT INTO nudges (goal_id, label, time_of_day) VALUES (?, ?, ?)'
  ).run(goal_id, label, time_of_day);

  const nudge = db.prepare('SELECT * FROM nudges WHERE id = ?').get(result.lastInsertRowid);
  return Response.json({ nudge }, { status: 201 });
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { id } = await request.json();
  db.prepare('DELETE FROM nudges WHERE id = ?').run(id);
  return Response.json({ ok: true });
}

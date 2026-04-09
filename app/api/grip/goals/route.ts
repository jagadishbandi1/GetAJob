import { getDb } from '@/lib/grip-db';

export async function GET() {
  const db = getDb();
  const goals = db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all();
  const milestones = db.prepare('SELECT * FROM milestones ORDER BY created_at ASC').all();
  return Response.json({ goals, milestones });
}

export async function POST(request: Request) {
  const db = getDb();
  const { title, emoji, color, description, milestones } = await request.json();

  if (!title) return Response.json({ error: 'title required' }, { status: 400 });

  const result = db.prepare(
    'INSERT INTO goals (title, emoji, color, description) VALUES (?, ?, ?, ?)'
  ).run(title, emoji ?? '🎯', color ?? '#a3e635', description ?? null);

  const goalId = result.lastInsertRowid;

  if (milestones?.length) {
    const insertMilestone = db.prepare('INSERT INTO milestones (goal_id, text) VALUES (?, ?)');
    for (const text of milestones) {
      if (text?.trim()) insertMilestone.run(goalId, text.trim());
    }
  }

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
  const ms = db.prepare('SELECT * FROM milestones WHERE goal_id = ?').all(goalId);
  return Response.json({ goal, milestones: ms }, { status: 201 });
}

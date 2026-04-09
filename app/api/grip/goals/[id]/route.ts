import { getDb } from '@/lib/grip-db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const { title, emoji, color, description, milestones } = await request.json();

  db.prepare(
    'UPDATE goals SET title = ?, emoji = ?, color = ?, description = ? WHERE id = ?'
  ).run(title, emoji, color, description, id);

  if (milestones !== undefined) {
    db.prepare('DELETE FROM milestones WHERE goal_id = ?').run(id);
    const insertMilestone = db.prepare('INSERT INTO milestones (goal_id, text) VALUES (?, ?)');
    for (const text of milestones) {
      if (text?.trim()) insertMilestone.run(id, text.trim());
    }
  }

  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  const ms = db.prepare('SELECT * FROM milestones WHERE goal_id = ?').all(id);
  return Response.json({ goal, milestones: ms });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const body = await request.json();

  // Patch milestone completion
  if (body.milestoneId !== undefined) {
    db.prepare('UPDATE milestones SET completed = ? WHERE id = ? AND goal_id = ?')
      .run(body.completed ? 1 : 0, body.milestoneId, id);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'nothing to patch' }, { status: 400 });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  return Response.json({ ok: true });
}

import { getDb } from '@/lib/grip-db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb();
  const { id } = await params;
  const body = await request.json();

  if (body.seen !== undefined) {
    db.prepare('UPDATE content_cards SET seen = ? WHERE id = ?').run(body.seen ? 1 : 0, id);
  }
  if (body.saved !== undefined) {
    db.prepare('UPDATE content_cards SET saved = ? WHERE id = ?').run(body.saved ? 1 : 0, id);
  }

  const card = db.prepare('SELECT * FROM content_cards WHERE id = ?').get(id);
  return Response.json({ card });
}

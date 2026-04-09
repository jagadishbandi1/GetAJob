import { getDb } from '@/lib/grip-db';

export async function GET(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const goalTag = searchParams.get('goal');
  const savedOnly = searchParams.get('saved') === 'true';

  let query = 'SELECT * FROM content_cards WHERE 1=1';
  const args: (string | number)[] = [];

  if (goalTag) {
    query += ' AND goal_tag = ?';
    args.push(goalTag);
  }
  if (savedOnly) {
    query += ' AND saved = 1';
  }

  // Prioritize unseen, then by date
  query += ' ORDER BY seen ASC, created_at DESC LIMIT 50';

  const cards = db.prepare(query).all(...args);
  return Response.json({ cards });
}

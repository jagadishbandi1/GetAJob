import { getDb } from '@/lib/grip-db';

export async function GET() {
  const db = getDb();

  // Get all check-in dates ordered descending
  const rows = db.prepare(
    'SELECT DISTINCT date FROM check_ins ORDER BY date DESC'
  ).all() as { date: string }[];

  if (!rows.length) {
    return Response.json({ streak: 0, lastCheckIn: null });
  }

  // Calculate streak: consecutive days ending today or yesterday
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const dates = rows.map(r => r.date);
  let streak = 0;

  // Start counting from today or yesterday
  let current = dates[0] === today ? today : (dates[0] === yesterday ? yesterday : null);
  if (!current) {
    return Response.json({ streak: 0, lastCheckIn: dates[0] });
  }

  for (const date of dates) {
    if (date === current) {
      streak++;
      const prev: Date = new Date(current);
      prev.setDate(prev.getDate() - 1);
      current = prev.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  return Response.json({ streak, lastCheckIn: dates[0] });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import type { ContextRule, Profile } from '@/lib/autofiller';
import { isDemo } from '@/lib/demo';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const sql = getDb();
  await initDb();
  const { jobUrl } = await req.json();

  if (!jobUrl) return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });

  const profileRows = await sql`SELECT * FROM profile WHERE id = 1`;
  const profile = profileRows[0] ?? null;
  const contextRules = await sql`SELECT trigger_keyword, response FROM context_rules`;

  const insertRows = await sql`
    INSERT INTO applications (job_url, status) VALUES (${jobUrl}, 'running') RETURNING id
  `;
  const row = insertRows[0] ?? null;
  if (!row) return NextResponse.json({ error: 'Could not create application' }, { status: 500 });
  const appId = row.id;

  const logs: string[] = [];
  const onLog = async (msg: string) => {
    logs.push(msg);
    await sql`UPDATE applications SET log=${logs.join('\n')} WHERE id=${appId}`;
  };

  // Demo mode: playwright cannot launch a browser on vercel, so don't even try.
  if (isDemo()) {
    await sql`
      UPDATE applications
      SET status='demo', log='this is a live demo. to autofill for real, clone the repo and run locally.'
      WHERE id=${appId}
    `;
    return NextResponse.json({ appId });
  }

  // fire-and-forget: return appId immediately. autofiller sets the final status
  // ('review' or 'failed') — do not overwrite it here.
  Promise.resolve()
    .then(async () => {
      const { runAutofiller } = await import('@/lib/autofiller');
      await runAutofiller(
        { jobUrl, appId, profile: profile as Profile, contextRules: contextRules as ContextRule[] },
        onLog
      );
    })
    .catch(async (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`Error: ${msg}`);
      try {
        await sql`UPDATE applications SET status='failed', log=${logs.join('\n')} WHERE id=${appId}`;
      } catch { /* db unreachable — self-heal will mark it failed later */ }
    });

  return NextResponse.json({ appId });
}

import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import type { ContextRule, Profile } from '@/lib/autofiller';

export async function POST(req: NextRequest) {
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
  // mark the application as 'demo' (a terminal state) and surface a friendly log.
  if (process.env.VERCEL) {
    await sql`
      UPDATE applications
      SET status='demo', log='this is a live demo. to autofill for real, clone the repo and run locally.'
      WHERE id=${appId}
    `;
    return NextResponse.json({ appId });
  }

  // fire-and-forget: return appId immediately, but guarantee a .catch() always
  // fires so the application never gets stuck in 'running'. wrapping in
  // Promise.resolve() ensures even a synchronous throw (e.g. failed dynamic
  // import) is caught and persisted as a 'failed' status.
  Promise.resolve()
    .then(async () => {
      const { runAutofiller } = await import('@/lib/autofiller');
      const { success } = await runAutofiller(
        { jobUrl, appId, profile: profile as Profile, contextRules: contextRules as ContextRule[] },
        onLog
      );
      await sql`UPDATE applications SET status=${success ? 'done' : 'failed'} WHERE id=${appId}`;
    })
    .catch(async (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      logs.push(`Error: ${msg}`);
      await sql`UPDATE applications SET status='failed', log=${logs.join('\n')} WHERE id=${appId}`;
    });

  return NextResponse.json({ appId });
}

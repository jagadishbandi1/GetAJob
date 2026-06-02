import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import type { ContextRule, Profile } from '@/lib/autofiller';

export async function POST(req: NextRequest) {
  const sql = getDb();
  await initDb();
  const { jobUrl } = await req.json();

  if (!jobUrl) return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });

  const [profile] = await sql`SELECT * FROM profile WHERE id = 1`;
  const contextRules = await sql`SELECT trigger_keyword, response FROM context_rules`;

  const [row] = await sql`
    INSERT INTO applications (job_url, status) VALUES (${jobUrl}, 'running') RETURNING id
  `;
  const appId = row.id;

  const logs: string[] = [];
  const onLog = async (msg: string) => {
    logs.push(msg);
    await sql`UPDATE applications SET log=${logs.join('\n')} WHERE id=${appId}`;
  };

  // Autofiller runs locally only — on cloud, flag as unsupported
  if (process.env.NODE_ENV === 'production') {
    await sql`UPDATE applications SET status='failed', log='Autofiller requires local installation. Download and run locally.' WHERE id=${appId}`;
    return NextResponse.json({ appId });
  }

  const { runAutofiller } = await import('@/lib/autofiller');
  runAutofiller(
    { jobUrl, appId, profile: profile as Profile, contextRules: contextRules as ContextRule[] },
    onLog
  ).then(async ({ success }) => {
    await sql`UPDATE applications SET status=${success ? 'done' : 'failed'} WHERE id=${appId}`;
  }).catch(async (err) => {
    await sql`UPDATE applications SET status='failed', log=${String(err)} WHERE id=${appId}`;
  });

  return NextResponse.json({ appId });
}

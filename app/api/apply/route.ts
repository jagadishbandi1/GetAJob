import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runAutofiller } from '@/lib/autofiller';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { jobUrl } = await req.json();

  if (!jobUrl) {
    return NextResponse.json({ error: 'jobUrl is required' }, { status: 400 });
  }

  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as Record<string, string>;
  const contextRules = db.prepare('SELECT trigger_keyword, response FROM context_rules').all() as { trigger_keyword: string; response: string }[];
  const accounts = db.prepare('SELECT platform, email, password FROM accounts').all() as { platform: string; email: string; password: string }[];

  // Log to DB
  const result = db.prepare(`
    INSERT INTO applications (job_url, status) VALUES (?, 'running')
  `).run(jobUrl);
  const appId = result.lastInsertRowid;

  const logs: string[] = [];
  const onLog = (msg: string) => {
    logs.push(msg);
    db.prepare('UPDATE applications SET log = ? WHERE id = ?').run(logs.join('\n'), appId);
  };

  // Run in background, return immediately with app ID
  runAutofiller({ jobUrl, appId, profile: profile as any, contextRules, accounts }, onLog)
    .then(({ success }) => {
      db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(success ? 'done' : 'failed', appId);
    })
    .catch((err) => {
      db.prepare('UPDATE applications SET status = ?, log = ? WHERE id = ?').run('failed', String(err), appId);
    });

  return NextResponse.json({ appId });
}

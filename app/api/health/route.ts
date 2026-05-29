import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const checks = {
    ai: !!process.env.ANTHROPIC_API_KEY,
    database: false,
    playwright: false,
    gmail: !!process.env.GOOGLE_CLIENT_ID,
  };

  try {
    const sql = getDb();
    await sql`SELECT 1 AS ok`;
    checks.database = true;
  } catch { /* db not connected */ }

  // Playwright check — just verify the module is importable
  try {
    await import('playwright');
    checks.playwright = true;
  } catch { /* playwright not available */ }

  return NextResponse.json(checks);
}

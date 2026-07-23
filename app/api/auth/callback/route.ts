import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isDemo } from '@/lib/demo';

export async function GET(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
  // Prod is a demo — don't let anyone write a Gmail token into the shared DB.
  if (isDemo()) return NextResponse.redirect(`${base}?gmail=demo`);
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${base}?gmail=error`);
  }

  const redirectUri = `${base}/api/auth/callback`;
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error('No access token');

    const sql = getDb();
    await sql`
      UPDATE profile SET
        gmail_token = ${tokens.access_token},
        gmail_refresh_token = ${tokens.refresh_token || ''}
      WHERE id = 1
    `;

    return NextResponse.redirect(`${base}?gmail=connected`);
  } catch (e) {
    console.error('Gmail OAuth error:', e);
    return NextResponse.redirect(`${base}?gmail=error`);
  }
}

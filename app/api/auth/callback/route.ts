import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';

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

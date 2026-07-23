import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for expensive API routes.
// Resets on cold start — good enough for a single-user portfolio app.
const buckets = new Map<string, { count: number; resetAt: number }>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'local';
}

export function rateLimit(
  req: NextRequest,
  { limit, windowMs }: { limit: number; windowMs: number }
): NextResponse | null {
  const key = clientKey(req);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (bucket.count >= limit) {
    return NextResponse.json(
      { error: 'too many requests — try again in a minute' },
      { status: 429 }
    );
  }

  bucket.count += 1;
  return null;
}

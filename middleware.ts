import { NextRequest, NextResponse } from 'next/server';

/**
 * In-memory rate limiter — 10 requests per minute per IP.
 *
 * For production at scale, replace the Map with Redis (e.g. @upstash/ratelimit).
 * The Map approach works fine for a single-instance deployment.
 */

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    // New window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    const resetAt = entry.windowStart + WINDOW_MS;
    return { allowed: false, remaining: 0, resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.windowStart + WINDOW_MS };
}

// Clean up stale entries periodically (prevent memory leak)
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now - entry.windowStart > WINDOW_MS * 2) {
        store.delete(ip);
      }
    }
  }, WINDOW_MS);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit the execute endpoint (the expensive one)
  if (pathname.startsWith('/api/orion/execute')) {
    const ip = getClientIP(request);
    const { allowed, remaining, resetAt } = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait before submitting another objective.',
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          },
        },
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/orion/:path*'],
};

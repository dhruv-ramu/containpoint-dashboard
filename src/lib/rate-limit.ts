/**
 * Simple in-memory rate limiter.
 * For production with multiple instances, use Redis-backed (e.g. @upstash/ratelimit).
 */

const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanup() {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    if (data.resetAt < now) store.delete(key);
  }
}

let cleanupTimer: ReturnType<typeof setInterval> | null = null;
function scheduleCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanup, CLEANUP_INTERVAL);
    if (cleanupTimer.unref) cleanupTimer.unref();
  }
}

export type RateLimitResult =
  | { success: true; remaining: number }
  | { success: false; retryAfter: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = WINDOW_MS
): RateLimitResult {
  scheduleCleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.resetAt < now) {
    entry.count = 1;
    entry.resetAt = now + windowMs;
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { success: true, remaining: limit - entry.count };
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  return ip;
}

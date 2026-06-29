// Simple in-memory rate limiter using fixed window
interface RateLimitEntry {
  count: number;
  windowStart: number; // timestamp in ms
}

const limits = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = limits.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window
    limits.set(ip, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

export function clearExpired(): void {
  const now = Date.now();
  for (const [ip, entry] of limits.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      limits.delete(ip);
    }
  }
}

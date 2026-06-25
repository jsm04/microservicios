# docs/tasks/008-rate-limiting-auth.md

## Metadata

- **ID:** 008
- **Title:** Add rate limiting to Auth endpoints
- **Status:** not-started
- **Parent spec:** —
- **Dependencies:** none
- **Created:** 2026-06-25
- **Completed:** —

## Scope

**In scope:**
- Add a simple in-memory rate limiter for Auth service `/create-user` and `/login` endpoints
- Limit: 10 requests per minute per IP address
- Return HTTP 429 (Too Many Requests) when limit is exceeded
- Use a minimal sliding-window or fixed-window approach (no external dependencies)

**Out of scope:**
- Redis-backed rate limiting (overkill for university project)
- Rate limiting for `/verify` endpoint (read-only, safe to leave unlimited)
- Configurable limits via environment variables (keep it simple)
- Per-endpoint different limits

## Approach

1. Create `services/auth/lib/rate-limiter.ts`:
   ```typescript
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
   ```

2. Add a cleanup interval in `services/auth/index.ts`:
   ```typescript
   setInterval(clearExpired, 120_000); // Clean up every 2 minutes
   ```

3. Apply rate limiting in the controller or as a wrapper:
   - Extract IP from `req.headers.get('X-Forwarded-For') || '127.0.0.1'`
   - Check rate limit before processing `/create-user` and `/login`
   - Return 429 with `{ code: 'RATE_LIMITED', message: 'Too many requests, try again later', retryAfter }`

4. Add `RateLimitError` code to ServiceError usage (reuse existing pattern).

5. Test: Send 11 rapid requests to `/login`, verify the 11th returns 429.

## Review Notes

<!-- Filled during review phase -->

## Handoff

<!-- Filled when context is about to fill -->

---

## Execution Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-06-25 | — | Created | Initial task breakdown |

## Lock Management

- **Before starting:** Check `tmp/lock.md`. If locked, pick a different task.
- **When starting:** Set the lock in `tmp/lock.md` with your session ID and reason.
- **When done:** Clear the lock in `tmp/lock.md`.

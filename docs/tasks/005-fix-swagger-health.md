# docs/tasks/005-fix-swagger-health.md

## Metadata

- **ID:** 005
- **Title:** Fix swagger UI in Auth service and add /health routes to all services
- **Status:** not-started
- **Parent spec:** —
- **Dependencies:** none
- **Created:** 2026-06-25
- **Completed:** —

## Scope

**In scope:**
- Fix Auth service swagger.html to use CDN (like Order and User services)
- Remove dead `/swagger-ui-dist/**` route from Auth's index.ts
- Add `/health` route to all three services (Auth, User, Order)
- Update docker-compose healthchecks to use `/health` consistently

**Out of scope:**
- Migrating Auth to PostgreSQL (task 001)
- Integration tests (task 003)
- API documentation (task 004)

## Approach

1. Replace Auth's swagger.html with CDN-based version (same pattern as Order/User)
2. Remove the `/swagger-ui-dist/**` static file route from Auth's index.ts (no longer needed)
3. Add a simple `/health` GET route to each service that returns `{"status":"ok"}`
4. Update docker-compose.yml healthchecks to all use `/health`

## Review Notes

<!-- Filled during review phase -->

## Handoff

<!-- Filled when context is about to fill -->

---

## Execution Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-06-25 | session | Created | Swagger broken in Auth; no /health routes exist anywhere |

## Lock Management

- **Before starting:** Check `tmp/lock.md`. If locked, pick a different task.
- **When starting:** Set the lock in `tmp/lock.md` with your session ID and reason.
- **When done:** Clear the lock in `tmp/lock.md`.

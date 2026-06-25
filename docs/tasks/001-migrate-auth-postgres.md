# docs/tasks/001-migrate-auth-postgres.md

## Metadata

- **ID:** 001
- **Title:** Migrate Auth service to PostgreSQL
- **Status:** not-started
- **Parent spec:** —
- **Dependencies:** none
- **Created:** 2026-06-25
- **Completed:** —

## Scope

**In scope:**
- Add `pg` dependency to Auth service `package.json`
- Create `services/auth/schema.sql` with a `users` table matching the existing in-memory `User` type
- Replace `services/auth/models/auth.model.ts` in-memory store with PostgreSQL queries
- Update `services/auth/index.ts` to initialize and close a DB pool
- Keep the same `User` interface shape so controllers don't break

**Out of scope:**
- Database migrations tooling (not needed for university project)
- Password hashing changes (keep current SHA-256 approach)
- Adding new endpoints or changing existing API contracts

## Approach

1. Create `services/auth/schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id         UUID PRIMARY KEY,
     name       TEXT NOT NULL,
     email      TEXT NOT NULL UNIQUE,
     password   TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
   Note: Auth uses `UUID` for user IDs (via `randomUUID()`), not `SERIAL`.

2. Add `pg` to Auth's `package.json` devDependencies and dependencies.

3. Rewrite `services/auth/models/auth.model.ts`:
   - Import `Pool` from `pg`
   - Create a module-level `db` pool using `process.env.DATABASE_URL`
   - Replace `users: User[] = []` with SQL queries:
     - `createUser(name, email, password)` → `INSERT ... RETURNING id, name, email`
     - `findUserByEmail(email)` → `SELECT ... WHERE email = $1`
     - `findUserById(id)` → `SELECT ... WHERE id = $1`
     - `emailExists(email)` → `SELECT 1 FROM users WHERE email = $1 LIMIT 1`
   - Keep `verifyPassword` using the existing SHA-256 hash comparison (no DB change needed)
   - Return type matches current `User` interface (id is `string` from UUID)

4. Update `services/auth/index.ts`:
   - Add `Pool` import and pool initialization (same pattern as User/Order services)
   - Add `await db.end()` in the shutdown function

5. Update `docker-compose.yml` to add Auth service dependency on postgres (check if already present).

6. Test: `docker compose up -d --build auth-service`, verify `/create-user`, `/login`, `/verify` still work.

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

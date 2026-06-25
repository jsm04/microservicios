# Task 001 Handoff: Migrate Auth Service to PostgreSQL

## Status
- **Task**: 001 - Migrate Auth service to PostgreSQL
- **Status**: INCOMPLETE - Bug found during testing
- **Last Updated**: 2026-06-25

## What Was Done
1. Created `services/auth/schema.sql` with users table schema (UUID primary key, TEXT fields, TIMESTAMPTZ)
2. Added `"pg": "^8.13"` dependency to `services/auth/package.json`
3. Rewrote `services/auth/models/auth.model.ts`:
   - Added PostgreSQL Pool connection
   - All functions now async (createUser, findUserByEmail, findUserById, emailExists)
   - Uses parameterized queries with $1, $2 placeholders
4. Updated `services/auth/index.ts`:
   - Added DB pool initialization
   - Added graceful shutdown with `await db.end()`
5. Updated `docker-compose.yml`:
   - Added DATABASE_URL environment variable to auth-service
   - Added depends_on postgres with health condition

## Bug Found During Testing
**Issue**: `create-user` endpoint returns `EMAIL_EXISTS` but no user is created in the database.

**Symptoms**:
- `SELECT * FROM users;` returns 0 rows
- POST to `/create-user` returns `{"code":"EMAIL_EXISTS","message":"Email already registered"}`
- POST to `/login` returns `{"code":"INVALID_CREDENTIALS","message":"Invalid email or password"}`

**Investigation Needed**:
- Check if `emailExists()` in auth.model.ts is returning false positives
- Verify the INSERT query in `createUser()` is executing correctly
- Check if there's a race condition or transaction issue
- Review the controller logic for create-user flow

## Next Steps
1. Debug and fix the create-user bug
2. Test login endpoint with valid credentials
3. Verify all Auth endpoints work with PostgreSQL
4. Commit changes
5. Update HARNESS.md to mark task 001 as completed

## Files Changed
- `services/auth/schema.sql` (NEW)
- `services/auth/package.json` (modified - added pg dependency)
- `services/auth/models/auth.model.ts` (rewritten for PostgreSQL)
- `services/auth/index.ts` (modified - added DB pool)
- `docker-compose.yml` (modified - auth-service env/depends_on)

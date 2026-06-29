# docs/tasks/009-fix-auth-model-db-reference.md

## Metadata

- **ID:** 009
- **Title:** Fix auth.model.ts `db` reference bug and clean up duplicate code
- **Status:** completed
- **Parent spec:** —
- **Dependencies:** none
- **Created:** 2026-06-29
- **Completed:** 2026-06-29

## Scope

**In scope:**
- Fix `findUserByEmail`, `findUserById`, and `emailExists` in `services/auth/models/auth.model.ts` to use `getDb()` instead of the undefined `db` variable — this causes a ReferenceError at runtime when any login or user lookup is attempted
- Remove the duplicate `setTestPool` / `getDb` definitions (lines 26-34) which are a copy-paste artifact
- Verify the fix by running `bun test services/auth/auth.test.ts`

**Out of scope:**
- Fixing port mismatch in docs (separate documentation task)
- Adding new features or tests beyond verifying existing ones pass

## Approach

1. Read `services/auth/models/auth.model.ts` and confirm the exact lines with `db.query()` vs `getDb().query()`
2. Replace `db.query` with `getDb().query` in `findUserByEmail`, `findUserById`, and `emailExists`
3. Remove the duplicate function block (copy-paste artifact)
4. Run `bun test services/auth/auth.test.ts` to verify no regressions

## Review Notes

<!-- Filled during review phase -->

## Handoff

<!-- Filled when context is about to fill -->

---

## Execution Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| 2026-06-29 | — | Created | Found via codebase graph analysis: `db` (undefined) used in 3 functions, `getDb()` correct in `createUser`. Duplicate function block also present. |
| 2026-06-29 | agent | Executed | Fixed all 3 `db.query` → `getDb().query` calls, removed duplicate function block, all 15 tests pass.

## Lock Management

- **Before starting:** Check `tmp/lock.md`. If locked, pick a different task.
- **When starting:** Set the lock in `tmp/lock.md` with your session ID and reason.
- **When done:** Clear the lock in `tmp/lock.md`.

## Service-Specific Notes

Working on **Auth service** (`services/auth/`). This is the registration/login service that was migrated to PostgreSQL in task 001. The bug prevents login and user lookup from working at runtime.

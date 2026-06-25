# docs/tasks/001-task-name.md

## Metadata

- **ID:** 001
- **Title:** Task name (short, imperative)
- **Status:** not-started
- **Parent spec:** `docs/specs/YYYY-MM-DD-topic.md`
- **Dependencies:** none (or list task IDs: `002`, `003`)
- **Created:** YYYY-MM-DD
- **Completed:** —

## Scope

**In scope:**
- What this task covers

**Out of scope:**
- What is explicitly excluded

## Approach

<!-- Filled during planning phase. One paragraph describing the planned approach. -->

## Review Notes

<!-- Filled during review phase. Feedback, decisions, changes requested. -->

## Handoff

<!-- Filled when context is about to fill. Follow docs/conventions/HANDOFF-FORMAT.md for the standard format. Save to `tmp/handoff-YYYY-MM-DD-task-id.md`. -->

---

## Execution Log

| Date | Agent | Action | Notes |
|------|-------|--------|-------|
| YYYY-MM-DD | — | Created | Initial task breakdown |

## Lock Management

- **Before starting:** Check `tmp/lock.md`. If locked, pick a different task.
- **When starting:** Set the lock in `tmp/lock.md` with your session ID and reason.
- **When done:** Clear the lock in `tmp/lock.md`.

## Service-Specific Notes

When working on a specific service, reference:

- **Auth** (`services/auth/`): Registration, login, token verification. Currently uses in-memory store.
- **User** (`services/user/`): User CRUD. PostgreSQL via `schema.sql`.
- **Order** (`services/order/`): Order management. PostgreSQL via `schema.sql`. Depends on User service via `UserClient`.

Shared layers:

- **Contracts** (`contracts/`): `UserClient`, `User`, `ServiceError` — type definitions only.
- **Libs** (`libs/`): `jwt.ts` (token generation/validation), `response.ts` (HTTP response builders).

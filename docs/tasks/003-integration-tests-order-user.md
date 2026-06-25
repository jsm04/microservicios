# docs/tasks/003-integration-tests-order-user.md

## Metadata

- **ID:** 003
- **Title:** Add integration tests for Order → User client
- **Status:** completed
- **Created:** 2026-06-25
- **Completed:** 2026-06-25

## Scope

**In scope:**
- Create a minimal test setup for the Order service that tests the `HttpUserClient` integration with the User service
- Test happy path: Order creation when user exists
- Test error path: Order creation fails when user doesn't exist (404 from User service)
- Test user lookup: `findUser()` returns null for non-existent ID

**Out of scope:**
- Unit tests for individual models or controllers
- Auth service tests
- Database-level tests
- CI pipeline integration (can be added later)

## Approach

1. Create `services/order/tests/` directory with a single test file:
   - `services/order/tests/integration.test.ts`

2. Use Bun's built-in test runner (`bun test`) — no external test framework needed.

3. Test setup:
   - Start User and Order services (or use existing running instances)
   - Create a test user via User service `/users` endpoint
   - Use that user ID to test Order service endpoints

4. Test cases:
   - **test_user_client_find_existing**: Call User service directly, verify `findUser` returns the user
   - **test_user_client_find_missing**: Call User service with non-existent ID, verify returns null
   - **test_order_create_with_valid_user**: Create order via Order service with valid userId, verify 201 response
   - **test_order_create_with_invalid_user**: Create order with fake userId, verify 404 from Order service

5. Run: `cd services/order && bun test`

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

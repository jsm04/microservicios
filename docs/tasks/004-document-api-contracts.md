# docs/tasks/004-document-api-contracts.md

## Metadata

- **ID:** 004
- **Title:** Document API contracts per service
- **Status:** not-started
- **Parent spec:** —
- **Dependencies:** none
- **Created:** 2026-06-25
- **Completed:** —

## Scope

**In scope:**
- Create a single `docs/api-contracts.md` file documenting all three service APIs
- For each service: base URL, endpoints (method, path, request body, response), error codes
- Document cross-service contracts: `UserClient` interface, `ServiceError` codes, JWT payload shape

**Out of scope:**
- Full OpenAPI/Swagger generation (Swagger UI already exists per service)
- API versioning strategy
- Authentication flow documentation (covered by Swagger)

## Approach

1. Create `docs/api-contracts.md` with the following structure:

   ```markdown
   # API Contracts

   ## Cross-Service Contracts
   - UserClient interface
   - ServiceError codes
   - JWT payload (JwtPayload)

   ## Auth Service (port 3003)
   | Method | Path | Request Body | Response | Error Codes |
   |--------|------|-------------|----------|-------------|
   | POST   | /create-user | {name, email, password} | {id, name, email} | MISSING_FIELDS, EMPTY_FIELDS, EMAIL_EXISTS |
   | POST   | /login       | {email, password}     | {token, user}    | MISSING_FIELDS, INVALID_CREDENTIALS |
   | GET    | /verify      | Bearer token          | {valid, user}    | UNAUTHORIZED, INVALID_TOKEN |

   ## User Service (port 3001)
   | Method | Path        | Request Body | Response | Error Codes |
   |--------|-------------|-------------|----------|-------------|
   | GET    | /users      | —           | {users}  | UNAUTHORIZED |
   | POST   | /users      | {name, email} | {id, name, email, created_at} | MISSING_FIELDS, EMPTY_FIELDS, UNIQUE_VIOLATION |
   | GET    | /users/:id  | —           | {user}   | UNAUTHORIZED, NOT_FOUND |

   ## Order Service (port 3002)
   | Method | Path         | Request Body                          | Response | Error Codes |
   |--------|-------------|---------------------------------------|----------|-------------|
   | GET    | /orders     | —                                     | {orders} | UNAUTHORIZED |
   | POST   | /orders     | {userId, items, total}                | {order}  | MISSING_FIELDS, EMPTY_FIELDS, NOT_FOUND, INTERNAL_ERROR |
   | GET    | /orders/:id | —                                     | {order}  | UNAUTHORIZED, NOT_FOUND |
   ```

2. Include a "Cross-Service Communication" section describing:
   - Order → User: `HttpUserClient.findUser(id)` calls `GET /users/:id`
   - JWT flow: Auth issues token, other services verify via `validateBearerToken()`

3. Keep it concise — this is for the university project, not production-grade API docs.

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

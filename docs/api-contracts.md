# API Contracts

Documented from source code — reflects actual behavior at time of generation.

---

## Cross-Service Contracts

### ServiceError

Standardized error type used across all services. Returned as JSON with `Content-Type: application/json`:

```json
{ "code": "<error-code>", "message": "<human-readable>" }
```

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `MISSING_FIELDS` | 400 | Required request fields absent |
| `EMPTY_FIELDS` | 400 | Required fields are empty/whitespace-only |
| `EMAIL_EXISTS` | 400 | Email already registered (Auth service) |
| `UNIQUE_VIOLATION` | 400 | Email already exists (User service DB constraint) |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid Authorization header |
| `INVALID_TOKEN` | 401 | Token is malformed, expired, or unsigned |
| `NOT_FOUND` | 404 | Referenced entity does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### JwtPayload

Decoded Bearer token contents (HS256, 24h TTL):

```typescript
interface JwtPayload {
  sub: string;    // User ID
  name: string;   // User name
  email: string;  // User email
  iat: number;    // Issued-at Unix timestamp
  exp: number;    // Expiration Unix timestamp
}
```

Issued by Auth service via `generateToken(sub, name, email)`. Verified by any service that requires authentication via `validateBearerToken()`.

### UserClient Interface

Cross-service contract for user lookup. Implemented as `HttpUserClient` in the Order service:

```typescript
interface UserClient {
  /** Find a user by ID. Returns null if not found. */
  findUser(id: string): Promise<User | null>;
}

interface User {
  id: number;
  name: string;
  email: string;
}
```

Order → User: `HttpUserClient.findUser(userId)` calls `GET /users/:id` on the User service. Returns `null` on non-200, which maps to `NOT_FOUND`.

---

## Auth Service

**Base URL:** `http://localhost:3003`
**Persistence:** PostgreSQL (`users` table with UUID PK, password stored as SHA-256 hash)
**Auth required:** No (login/register are public; verify requires Bearer token)

### `POST /create-user`

Register a new user.

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | string | Yes |
| `password` | string | Yes |

**Success (201):**
```json
{ "id": "<uuid>", "name": "<name>", "email": "<email>" }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `MISSING_FIELDS` | 400 | Any of name/email/password absent |
| `EMPTY_FIELDS` | 400 | Any field is empty/whitespace-only |
| `EMAIL_EXISTS` | 400 | Email already registered |

---

### `POST /login`

Authenticate and receive a JWT.

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Success (200):**
```json
{
  "token": "<jwt>",
  "user": { "id": "<uuid>", "name": "<name>", "email": "<email>" }
}
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `MISSING_FIELDS` | 400 | email or password absent |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |

---

### `GET /verify`

Verify a Bearer token.

**Header:** `Authorization: Bearer <token>`

**Success (200):**
```json
{ "valid": true, "user": { "id": "<sub>", "name": "<name>", "email": "<email>" } }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | No Authorization header or not Bearer |
| `INVALID_TOKEN` | 401 | Token expired, malformed, or unsigned |

---

### `GET /health`

**Success (200):**
```json
{ "status": "ok" }
```

---

## User Service

**Base URL:** `http://localhost:3001`
**Persistence:** PostgreSQL (`users` table with SERIAL PK)
**Auth required:** Yes — all user endpoints require a valid Bearer token via `authMiddleware`

### `GET /users`

List all users.

**Header:** `Authorization: Bearer <token>`

**Success (200):**
```json
[
  { "id": <number>, "name": "<string>", "email": "<string>", "created_at": "<ISO-8601>" }
]
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |

---

### `POST /users`

Create a new user.

**Header:** `Authorization: Bearer <token>`

| Field | Type | Required |
|-------|------|----------|
| `name` | string | Yes |
| `email` | string | Yes |

**Success (201):**
```json
{ "id": <number>, "name": "<string>", "email": "<string>", "created_at": "<ISO-8601>" }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |
| `MISSING_FIELDS` | 400 | name or email absent |
| `EMPTY_FIELDS` | 400 | Any field is empty/whitespace-only |
| `UNIQUE_VIOLATION` | 400 | Email already exists (DB constraint) |

---

### `GET /users/:id`

Get a user by ID.

**Header:** `Authorization: Bearer <token>`

**Success (200):**
```json
{ "id": <number>, "name": "<string>", "email": "<string>", "created_at": "<ISO-8601>" }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |
| `NOT_FOUND` | 404 | User does not exist |

---

### `GET /health`

**Success (200):**
```json
{ "status": "ok" }
```

---

## Order Service

**Base URL:** `http://localhost:3002`
**Persistence:** PostgreSQL (`orders` table, SERIAL PK, JSONB items)
**Auth required:** Yes — all order endpoints require a valid Bearer token
**Cross-service:** Validates user existence via `HttpUserClient.findUser(userId)` → `GET /users/:id` on User service

### `GET /orders`

List all orders.

**Header:** `Authorization: Bearer <token>`

**Success (200):**
```json
[
  { "id": <number>, "user_id": <number>, "items": ["<item>", ...], "total": <number>, "created_at": "<ISO-8601>" }
]
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |

---

### `POST /orders`

Create a new order. Validates user exists via User service before persisting.

**Header:** `Authorization: Bearer <token>`

| Field | Type | Required |
|-------|------|----------|
| `userId` | string (UUID) | Yes |
| `items` | string[] | Yes |
| `total` | number | Yes |

**Success (201):**
```json
{ "id": <number>, "user_id": <number>, "items": ["<item>", ...], "total": <number>, "created_at": "<ISO-8601>" }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |
| `MISSING_FIELDS` | 400 | Any required field absent or total undefined |
| `EMPTY_FIELDS` | 400 | items array is empty |
| `NOT_FOUND` | 404 | Referenced user does not exist (via User service) |
| `INTERNAL_ERROR` | 500 | Database write failure |

---

### `GET /orders/:id`

Get an order by ID.

**Header:** `Authorization: Bearer <token>`

**Success (200):**
```json
{ "id": <number>, "user_id": <number>, "items": ["<item>", ...], "total": <number>, "created_at": "<ISO-8601>" }
```

**Errors:**

| Code | Status | Condition |
|------|--------|-----------|
| `UNAUTHORIZED` | 401 | Missing/invalid Authorization header |
| `NOT_FOUND` | 404 | Order does not exist |

---

### `GET /health`

**Success (200):**
```json
{ "status": "ok" }
```

---

## Authentication Flow

```
┌──────────┐     POST /login        ┌───────────┐
│  Client   │ ──────────────────►   │  Auth Svc │
│           │  {email, password}     │  (3003)   │
│           │ ◄──────────────────    │           │
│           │  {token, user}         └───────────┘
└──────────┘                              │
          │                               │
          │  GET /users/:id               │
          │  Authorization: Bearer <tok>  │
          ▼                               │
     ┌───────────┐                        │
     │ User Svc  │ ◄──────────────────────┘
     │  (3001)   │  validates via Auth
     └───────────┘
```

1. Client calls `POST /login` on Auth service to obtain a JWT.
2. Client includes `Authorization: Bearer <token>` in requests to User or Order services.
3. Each service validates the token via `validateBearerToken()` from `libs/jwt.ts`.
4. Order service additionally calls User service (`GET /users/:id`) via `HttpUserClient` to verify user existence before creating an order.

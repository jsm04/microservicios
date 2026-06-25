# Project Context

## University Project
This is a university project demonstrating microservices architecture. Simplicity and working code take priority over production-grade complexity. Minimal dependencies, clear structure, and reliable execution are the guiding principles.

## User
A registered account holder identified by a unique ID. Has a `name` and a unique `email`. Created via registration or the user service. Used as the principal for authentication (JWT `sub`) and order ownership.

## Auth
The authentication subsystem responsible for user registration, login, and token verification. Produces JWT tokens containing `sub`, `name`, and `email`. Does not manage persistent storage — delegates to the User service in production.

## Order
A purchase record owned by a User. Contains an array of `items` (strings) and a numeric `total`. Created after validating that the referenced user exists via the User service.

## ServiceError
A standardized error type used across all services. Carries a machine-readable `code`, a human-readable `message`, and an HTTP `status` code. Returned as JSON responses with `Content-Type: application/json`.

## JwtPayload
The decoded contents of a Bearer token. Contains `sub` (user ID), `name`, `email`, `iat` (issued-at timestamp), and `exp` (expiration). Issued by the Auth service, verified by any service that requires authentication.

## UserClient
An interface for cross-service user lookup. Implemented as `HttpUserClient` which calls the User service HTTP endpoint. Used by the Order service to validate user existence before creating orders.

## User Service
A microservice that manages the User lifecycle (create, read, list). Uses PostgreSQL with schema defined in `schema.sql`. Exposes REST endpoints for user operations.

## Auth Service
A microservice handling registration and login. Currently uses an in-memory store for users; production mode delegates persistence to the User service. Issues JWT tokens signed with HS256.

## Order Service
A microservice managing Order records. Depends on the User service via `UserClient` for user validation. Uses PostgreSQL with schema defined in `schema.sql`.

## Shared Contracts
Type definitions and interfaces shared across services, located in `contracts/`. Includes `UserClient`, `User`, and `ServiceError`. Enforces consistent types without runtime coupling.

## Shared Libraries
Reusable utilities in `libs/`:
- `jwt.ts` — JWT token generation and Bearer token validation.
- `response.ts` — Standardized HTTP response builders (`json`, `text`, `error`).

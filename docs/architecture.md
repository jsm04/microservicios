# Architecture

## Context

This is a **university project** — the goal is to demonstrate microservices concepts with working code, not production-grade complexity. Keep things simple: minimal dependencies, clear structure, and everything that runs reliably matters more than features that don't.

## Overview

This project is a set of TypeScript microservices communicating over HTTP, deployed via Docker Compose. Services share type contracts through a `contracts/` package and use shared libraries in `libs/`.

## Services

| Service | Port | Purpose | Persistence |
|---------|------|---------|-------------|
| Auth | 3000 | Registration, login, token verification | In-memory (dev) / User service (prod) |
| User | 3001 | User CRUD operations | PostgreSQL |
| Order | 3002 | Order creation and retrieval | PostgreSQL |

## Communication

- **Synchronous HTTP**: The Order service calls the User service via `HttpUserClient` to validate user existence before creating orders.
- **JWT-based auth**: Auth service issues HS256-signed JWT tokens. Any service can verify tokens using `validateBearerToken()` from `libs/jwt.ts`.

## Shared Layers

```
contracts/          → Type definitions (UserClient, User, ServiceError)
libs/               → Reusable utilities (jwt.ts, response.ts)
services/{auth,user,order}/  → Individual microservices
```

## Error Handling

All services use `ServiceError` from `contracts/service-error.ts` for standardized error responses. The `response.error()` helper in `libs/response.ts` serializes errors to JSON with the correct HTTP status.

## Deployment

Services are containerized (Dockerfile per service) and orchestrated via `docker-compose.yml`.

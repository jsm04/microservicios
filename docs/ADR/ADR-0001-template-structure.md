# ADR-0001: Project Structure and Agentic Workflow

## Status
Accepted

## Context
This is a **university project** — a TypeScript microservices demo. We need a clear structure for both development and AI-agent collaboration, but simplicity and working code take priority over production-grade complexity.

## Decision
- **Root-level**: `CONTEXT.md` (domain glossary), `README.md`, `FEATURES.md`, `testing-auth.md` — entry points for humans and agents.
- **`services/`**: One directory per microservice (`auth`, `user`, `order`), each with its own `Dockerfile`, `package.json`, `controllers/`, `models/`, `views/`.
- **`contracts/`**: Shared type definitions (`UserClient`, `User`, `ServiceError`) used across services without runtime coupling.
- **`libs/`**: Reusable utilities (`jwt.ts`, `response.ts`).
- **`docs/ADR/`**: Architecture Decision Records, one per file, numbered sequentially.
- **`docs/conventions/`**: Writing and workflow conventions (CONTEXT-FORMAT, ADR-FORMAT, HANDOFF-FORMAT, REVIEW-CHECKLIST).
- **`docs/tasks/`**: Task definitions and HARNESS for task management.
- **`.cursor/rules/`**: Agent-specific configuration (`agentic-workflow.mdc`).
- **`.vscode/settings.json`**: VS Code workspace settings (file exclusions).
- **`tmp/`**: Temporary artifacts (handoffs, lock, session state) — not committed to git.

## Consequences
- New ADRs must be numbered sequentially in `docs/ADR/`.
- `CONTEXT.md` is the source of domain vocabulary — all ADRs and specs must use these terms.
- Agent rules live in `.cursor/rules/` to keep them separate from project docs.
- Each service is independently deployable with its own `Dockerfile` and `package.json`.
- Cross-service dependencies flow through `contracts/` interfaces, not direct imports.

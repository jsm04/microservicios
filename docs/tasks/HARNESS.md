# Task Harness

This file defines the active task set for the current project phase. Agents should **only** consider tasks listed in the `## Active Tasks` section. Tasks not listed here are either completed, deferred, or outside the current scope.

> **University project note:** Keep changes simple and working. Don't add complexity unless it directly supports a learning objective or demo requirement.

## Active Tasks

<!-- List only tasks that are not-started, planned, in-progress, or reviewed. -->
<!-- Once a task is done, remove it from this list. -->

| ID | Title | Status | Dependencies |
|----|-------|--------|--------------|
| 001 | Migrate Auth service to PostgreSQL | not-started | none |
| 003 | Add integration tests for Order → User client | not-started | 001 |
| 004 | Document API contracts per service | not-started | none |
| 008 | Add rate limiting to Auth endpoints | not-started | none |

## Completed Tasks

<!-- Move tasks here when they are done. Agents should not re-review these unless explicitly referenced. -->

| ID | Title | Completed | Notes |
|----|-------|-----------|-------|
| 002 | Add health check endpoints to all services | 2026-06-25 | Added /health to Auth, User, Order; updated docker-compose |
| 005 | Fix swagger UI in Auth service | 2026-06-25 | Replaced local swagger-ui-dist with CDN; removed dead route |

## Deferred Tasks

<!-- Tasks that are valid but not needed right now. -->

| ID | Title | Reason |
|----|-------|--------|
| — | — | — |

## Next Task

<!-- Set when a task completes. This is what the next session should work on. -->

| Field | Value |
|-------|-------|
| **Task ID** | 001 |
| **Title** | Migrate Auth service to PostgreSQL |
| **Set by** | session |
| **Set at** | 2026-06-25 |
| **Notes** | Auth currently uses in-memory store; User and Order services use PostgreSQL. Align persistence layer. Task 008 (rate limiting) is independent and can be done in parallel. |

## Dependency Rules

- A task with dependencies **cannot** be started until all listed dependencies are `done`.
- Dependencies are by task ID (e.g., `002`, `003`).
- If a dependency is in `Deferred` or `Completed`, it blocks the dependent task.
- Circular dependencies are forbidden — validate before adding.

## Agent Instructions

1. **Read this file first.** Only work on tasks in `Active Tasks`.
2. **Check dependencies** before starting any task.
3. **Move completed tasks** to `Completed Tasks` and remove from `Active Tasks`.
4. **Never re-review a done task** unless explicitly asked.

## Task Completion Flow

When a task is finished:

1. **Run the review checklist** — `docs/conventions/REVIEW-CHECKLIST.md`
2. **If something is broken** — fix it, keep status as `in-progress`, note in Review Notes
3. **If everything passes** — create handoff in `tmp/` (follow `HANDOFF-FORMAT.md`), commit, then proceed to next task
4. **Commit convention** — Conventional Commits with task ID scope: `feat(001): description`

# Agentic Workflow

## Auto-Discovery (Startup)

On every new session, read these files in order to determine what to do:

1. **`tmp/session.md`** — Is there an active task? If status is `working`, continue it. If `committed`, check if next task is pending.
2. **`docs/tasks/HARNESS.md`** — If no active session, find the next available task (not-started or planned). Check dependencies first.
3. **`tmp/lock.md`** — Before starting any task, check if another session has the lock. If locked, pick a different task or wait.

If nothing to do: report "no active tasks" and suggest checking specs for pending work.

## Project Conventions
- Always read `CONTEXT.md` before making design decisions.
- Check `docs/ADR/` before proposing changes that might conflict with past decisions.
- Use domain terms from `CONTEXT.md` consistently — no synonyms.
- **Services**: Auth (port 3000), User (port 3001), Order (port 3002). Each has its own `Dockerfile`, `package.json`, `controllers/`, `models/`, `views/`.
- **Contracts**: Cross-service types live in `contracts/` (`UserClient`, `User`, `ServiceError`). Never import service-specific types across service boundaries.
- **Libs**: Shared utilities in `libs/` — `jwt.ts` for token ops, `response.ts` for HTTP response builders.
- **Error handling**: Use `ServiceError` with machine-readable codes (`MISSING_FIELDS`, `EMAIL_EXISTS`, `INVALID_CREDENTIALS`, etc.). Always return JSON via `response.json()` or `response.error()`.

## Workflow
1. **Discovery** — Explore codebase, gather context
2. **Alignment** — Clarify requirements with the user
3. **Design** — Create formal spec in `docs/specs/`
4. **Task breakdown** — Create tasks in `docs/tasks/`, update HARNESS.md
5. **Grilling** — Stress-test design against CONTEXT.md and ADRs
6. **Implementation** — Execute approved tasks from HARNESS.md

## File Naming
- ADRs: `docs/ADR/ADR-NNNN-title.md` (sequential numbering)
- Specs: `docs/specs/YYYY-MM-DD-topic.md` (date-prefixed)
- Tasks: `docs/tasks/NNN-task-name.md` (zero-padded, TEMPLATE.md as reference)

## Task Management
- Always read `docs/tasks/HARNESS.md` first — only work on Active Tasks
- Check dependencies before starting any task
- Move completed tasks to Completed section, remove from Active
- Never re-review a done task unless explicitly asked
- Use the handoff skill when context fills — save to temp dir, not workspace

## Handoff
When context is filling:
1. Invoke the handoff skill to create a compact summary
2. Save to temp dir (not workspace)
3. Note which task was in progress and what the next agent should do

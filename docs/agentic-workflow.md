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

## Pre-Commit Checklist
Before every commit, run this checklist to prevent stale state from causing loops in future sessions.

### Step 1 — Cross-check session.md against HARNESS.md
Read both files. Verify:
- If `session.md` status is `working` or `in-progress`, the corresponding task in HARNESS.md must be in `Active Tasks` with matching status.
- If `session.md` status is `idle` or `committed`, the last action must reference a commit hash that actually exists (check `git log --oneline -5`).
- If `session.md` lists an active task, HARNESS.md must NOT have that task in `Completed Tasks`.

**Fix if stale:**
- Session idle but session.md says working → set status to `idle`, update `Last action` and `Last commit`.
- Session working but HARNESS.md has task completed → pick next active task or set idle.

### Step 2 — Validate HARNESS.md Next Task
Read the `## Next Task` section. Verify:
- The referenced task ID exists in `Active Tasks` or `Completed Tasks`.
- If it's in `Completed Tasks`, update it to the next unstarted/planned task.
- The task is not `Deferred`.

**Fix if stale:**
- Point Next Task to the first non-completed, non-deferred active task (by ID order).
- Update `Set by` and `Set at` fields.

### Step 3 — Clear expired locks in lock.md
Read `## Current Lock`. Verify:
- If a lock exists, check if the referenced task is still in HARNESS.md `Active Tasks`.
- If the task is in `Completed Tasks` or no longer active, move the lock to `Last Released Locks` and clear `Current Lock`.

**Fix if stale:**
- Clear `Current Lock`, add entry to `Last Released Locks` table with reason "Task completed / abandoned".

### Step 4 — Commit state updates together with code
When state files change:
1. Run `git diff` to verify only HARNESS.md, session.md, and/or lock.md are modified (plus code changes).
2. Commit state updates in the same commit as the code changes — do NOT split them into separate commits.
3. Use conventional commit prefix: `chore:` for state-only, `feat:`/`fix:` when code changes are included.
4. Update `Last commit` in session.md to the new commit hash.

### Step 5 — Final sanity check
Before ending the turn:
- [ ] session.md status matches actual work done
- [ ] HARNESS.md Next Task points to a valid pending task
- [ ] lock.md has no active locks (unless actively working on that task)
- [ ] All state files committed in same commit as code changes

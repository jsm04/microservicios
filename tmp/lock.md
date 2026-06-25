# Task Lock

Prevents multiple sessions from working on the same task simultaneously.

## Current Lock

- **Task ID:** 001
- **Locked by:** session (2026-06-25)
- **Locked at:** 2026-06-25
- **Reason:** Migrate Auth service to PostgreSQL

## Rules

- Always check this file before starting a task. If another session has the lock, wait or pick a different task.
- Release the lock when done (clear the file).
- Locks are not enforced by git — they're a convention for agents to follow.

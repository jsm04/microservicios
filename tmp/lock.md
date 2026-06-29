# Task Lock

Prevents multiple sessions from working on the same task simultaneously.

## Current Lock

- **No active lock**

## Last Released Locks

| Task ID | Released by | Released at | Reason |
|---------|-------------|-------------|--------|
| 001 | session | 2026-06-25 | Committed in 7ebb229 |
| 003 | session | 2026-06-25 | Committed in 7ebb229 |
| **008** | agent | 2026-06-29 | Task completed — rate limiter implemented and tested

## Rules

- Always check this file before starting a task. If another session has the lock, wait or pick a different task.
- Release the lock when done (clear the file).
- Locks are not enforced by git — they're a convention for agents to follow.

# Task Lock

Prevents multiple sessions from working on the same task simultaneously.

## Current Lock

- **Task ID:** —
- **Locked by:** — (session identifier, e.g., agent name or timestamp)
- **Locked at:** —
- **Reason:** —

## Rules

- Always check this file before starting a task. If another session has the lock, wait or pick a different task.
- Release the lock when done (clear the file).
- Locks are not enforced by git — they're a convention for agents to follow.

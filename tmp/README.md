# Temporary Files

This directory is for temporary artifacts: handoff documents, intermediate outputs, and session exports.

## Handoffs

All handoff documents should be saved here, not in the system temp directory.

Format: `handoff-YYYY-MM-DD-task-id.md`

Example: `handoff-2026-06-25-001.md`

## Rules

- These files are **not committed** to git (see `.gitignore`).
- Clean up old handoffs periodically — they're for active work, not archival.
- Archived handoffs can be moved to `docs/` if they contain useful decisions.

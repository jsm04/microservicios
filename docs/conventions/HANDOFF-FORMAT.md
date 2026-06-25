# Handoff Format

Standardized handoff format for preserving context between agent sessions. Use this when creating handoff documents via the handoff skill.

## When to Create a Handoff

- Context is filling (approaching token limits)
- Switching between tasks
- Before committing work that spans multiple sessions
- When a task is paused mid-implementation

## Handoff Template

```markdown
# Handoff: [Task ID] - [Task Title]

## Session Summary
[What was accomplished in this session. 2-3 sentences.]

## Current State
- **Active task:** Task ID - Title
- **Status:** [what phase we're in]
- **Last action:** [what was just done]

## What's Next
1. [Immediate next step]
2. [Follow-up]
3. [Longer-term]

## Context the Next Agent Needs
- [Relevant facts, decisions, or constraints]
- [Files that need to be read]
- [Things to avoid]

## Open Questions
- [Any unresolved decisions or uncertainties]

## Files Modified
| File | Change |
|------|--------|
| path/to/file | description |

## Diff Summary
[High-level summary of changes. Link to full diff if available.]

## Suggested Skills
- [Skills the next agent should invoke, if any]
```

## Rules

- **Save to `tmp/`** — never save handoffs to the workspace root or system temp. Use `tmp/handoff-YYYY-MM-DD-task-id.md`.
- **Reference artifacts by path** — don't duplicate content from specs, ADRs, or task files. Reference them instead.
- **Keep it compact** — this is for context preservation, not documentation. Be brief.
- **Redact sensitive info** — no API keys, passwords, or PII.
- **Link to the active task** — always note which task is in progress and its status.

# ADR Format

Architecture Decision Records capture design decisions so future reviews don't re-litigate them.

## Format

```markdown
# ADR-NNNN: <Short Title>

## Status
Proposed | Accepted | Deprecated | Superseded

## Context
What problem or constraint exists? What forces are at play?

## Decision
What did we decide? One paragraph.

## Consequences
What happens because of this decision? What is gained? What is lost?

## Supersedes
ADR-NNNN (if applicable)

## Superseded by
ADR-NNNN (if applicable)
```

## Rules

- **Number sequentially.** Start at 0001. Never renumber.
- **Status matters.** "Proposed" = not reviewed yet. "Accepted" = in effect. "Deprecated" = still valid but no longer recommended. "Superseded" = replaced by a newer ADR.
- **Record decisions, not facts.** If the reason is "because the framework does X," that's a constraint, not a decision. Record the _choice_ you made given that constraint.
- **Only record load-bearing decisions.** Don't create an ADR for every decision. Only when a future explorer needs to know why something was done.
- **Reference CONTEXT.md terms.** Use the domain vocabulary, not implementation jargon.

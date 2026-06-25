# CONTEXT.md Format

`CONTEXT.md` is the project's domain glossary. It gives names to concepts, modules, and boundaries so that architecture reviews and AI agents use consistent terminology.

## Rules

- **One term per section.** Use `## TermName` headings.
- **Define the term precisely.** What is it? What isn't it? What invariants hold?
- **Use the term consistently.** Once a name is chosen, never use a synonym for the same concept.
- **Add terms as they emerge.** If you name a concept during a design session that isn't in the file, add it.
- **Don't define implementation details.** Only define domain concepts — not functions, classes, or file paths.

## Example

```markdown
## User
A registered account holder. Not an anonymous visitor. Has a role (admin, member, guest).

## Project
A collection of resources owned by a User. Created, edited, and deleted by the owner.
```

## Relationship to ADRs

ADRs record decisions about how domain concepts are implemented. CONTEXT.md records what the concepts _are_. If an ADR conflicts with the domain model, the domain model wins — update the ADR, not the glossary.

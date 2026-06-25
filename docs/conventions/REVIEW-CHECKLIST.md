# Task Review Checklist

Use this checklist when completing a task. Only proceed to the next task after all items pass.

## Completion Checklist

- [ ] **Scope check** — Did we deliver everything in scope? Nothing missing?
- [ ] **Out of scope** — Did we avoid scope creep? Nothing extra was added?
- [ ] **No regressions** — Existing functionality still works? No unintended side effects?
- [ ] **Context updated** — CONTEXT.md updated if new domain terms were introduced?
- [ ] **ADRs checked** — Any decisions made that should be recorded as a new ADR?
- [ ] **Spec aligned** — Implementation matches the approved design spec?
- [ ] **Diff reviewed** — Full diff inspected, not just the summary?

## If Something Is Broken

1. **Fix it before committing.** Do not defer regressions to the next task.
2. **Update this task's status** to `in-progress` (not `done`) until fixed.
3. **Note the issue** in Review Notes section of the task file.
4. **Only mark done** after the fix is verified.

## If Everything Passes

1. Create a handoff using `docs/conventions/HANDOFF-FORMAT.md` (save to `tmp/`).
2. Commit with a conventional commit message.
3. Move task to `Completed Tasks` in HARNESS.md.
4. Remove from `Active Tasks`.
5. Proceed to the next available task (check dependencies first).

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

**Types:**
- `feat` — new functionality
- `fix` — bug fix
- `refactor` — code change that neither fixes a bug nor adds a feature
- `docs` — documentation only
- `chore` — maintenance, config, tooling
- `test` — test additions or modifications

**Scope:** The task ID (e.g., `001`) or the module name.

**Examples:**
```
feat(001): add user authentication module
refactor(002): extract data layer into separate package
docs: update architecture overview
```

---
name: refactor
description: Refactor safely — behavior-preserving changes guarded by tests, small steps.
---

When refactoring (improving structure without changing behavior):

1. **Establish a safety net first**: run existing tests (or add a quick characterization test) so you can prove behavior is unchanged.
2. **Small, reversible steps**: rename, extract function, dedup, simplify — one logical change at a time. Run tests after each.
3. **Don't mix refactor + feature/fix** in the same pass. Structure now, behavior later (or vice versa) — never both at once.
4. **Prefer `edit_file`** targeted edits; for repo-wide renames use `grep` first to see every call site.
5. **Delete dead code** only after confirming with `grep` it's truly unused.
6. **Verify**: full test run green + a quick manual run. Report what got simpler and why.

---
name: git-commit
description: Make a clean conventional commit after reading the real diff, with a secret scan.
---

When the user wants to commit:

1. Run `git status` and `git diff --staged` (or `git diff` if nothing is staged) to READ the real changes. Don't guess.
2. Quick secret scan of the diff: strings like `sk-`, `AKIA`, `-----BEGIN`, `password=`, long tokens. If found → STOP, warn the user, do NOT commit.
3. `git add` the relevant files (skip node_modules, .env, build artifacts).
4. Write a message: `type(scope): short description` — type ∈ feat|fix|docs|refactor|test|chore. First line ≤ 72 chars.
5. `git commit -m "..."`. Report back the hash + message.

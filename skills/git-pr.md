---
name: git-pr
description: Open a pull request the right way — branch, push, and a body that reads the real diff.
---

When the user wants a PR:

1. **Branch**: never work on the default branch. `git checkout -b type/short-name` if not already on a feature branch.
2. **Commit** cleanly first (see the git-commit skill: read the diff, scan for secrets).
3. **Push**: `git push -u origin <branch>`.
4. **Body from the real diff**: read `git diff <base>...HEAD` and the commit log. Write: what changed, why, how to test, risks. Don't invent.
5. **Open it**: `gh pr create --base <base> --title "..." --body "..."` (use `gh` if available; otherwise print the compare URL for the user).
6. Report the PR URL.

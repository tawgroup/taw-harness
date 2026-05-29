---
name: debug
description: Systematic debugging — reproduce, find root cause, minimal fix, verify.
---

When you hit an error/bug:

1. **Reproduce**: run the failing command with `bash`, read the FULL stack trace / error message.
2. **Localize**: `grep` for the function/variable/file named in the error. `read_file` the suspicious spots.
3. **Root cause**: identify the ROOT CAUSE, don't patch symptoms. Briefly explain why it fails.
4. **Minimal fix**: `edit_file` the smallest change that fixes it. Don't refactor unrelated code.
5. **Verify**: re-run the original command/test with `bash`, confirm the error is gone.
6. Report: what broke, why, what you changed (1-3 lines).

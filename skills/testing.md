---
name: testing
description: Write fast, meaningful tests and run them to green — unit + integration, no flakiness.
---

When asked to add/write tests, or before shipping a change:

1. **Pick the runner already in the repo** (check package.json / config): node:test, vitest, jest, pytest, go test. Don't introduce a new one without reason.
2. **Test behavior, not implementation**: assert on inputs→outputs and side effects, not private internals.
3. **Cover the important paths**: happy path, edge cases, error/invalid input, and any bug you just fixed (regression test).
4. **Isolate**: no shared mutable state between tests; reset fixtures in before/after; never write to real data/config files — use temp files or a test DB.
5. **No network/time flakiness**: stub external calls, inject clocks, avoid `sleep`.
6. **Run them** with `bash` and iterate until ALL pass. Paste the summary (X passed / Y failed).
7. Keep tests fast — if one is slow, isolate it.

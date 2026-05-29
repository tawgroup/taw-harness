---
name: perf
description: Fix performance problems by measuring first, then targeting the real bottleneck.
---

When something is slow:

1. **Measure, don't guess**: reproduce with a timing (`time`, a benchmark, profiler, or log timestamps). Find the actual hot path before changing anything.
2. **Usual suspects**: N+1 queries (batch / join / cache), missing DB index, work inside a loop that could be hoisted, syncronous I/O, re-computing instead of caching, oversized payloads.
3. **Algorithmic first**: an O(n²)→O(n) change beats micro-tuning. Check data-structure choice.
4. **One change at a time**, re-measure after each — keep what helps, revert what doesn't.
5. **Don't sacrifice correctness or readability** for tiny gains. Stop when it's fast enough.
6. Report: before vs after numbers, and what actually moved the needle.

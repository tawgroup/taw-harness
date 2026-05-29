---
name: frontend
description: Build a clean, working web UI (vanilla or framework) — structure, state, and a real boot check.
---

When building a frontend:

1. **Split into small files** (< ~180 lines): a core/util module (fetch wrapper, helpers), one module per view/screen, a main/router. Avoid one giant file (it tends to hang generation).
2. **State**: keep a single source of truth; re-render from state after each change. Store auth token in localStorage and send it on API calls; on 401, clear it and show login.
3. **Structure**: dashboard = sidebar + topbar + content area. Tables for lists, modals for create/edit, confirm before delete.
4. **Design quality (avoid generic AI look)**: consistent palette, spacing scale, rounded corners, subtle shadows, hover states, status badges, money/number formatting per locale. Use system fonts; no CDN if zero-dep is required.
5. **All user-facing text** in the language the user asked for.
6. **Verify**: `node --check` each JS file; boot the server and confirm `/` returns the page and a real action works.

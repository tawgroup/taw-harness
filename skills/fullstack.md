---
name: fullstack
description: Playbook for building a full-stack web app (backend + frontend) that actually runs, avoiding the usual traps.
---

# Full-stack build playbook

Follow this order. Goal: an app that REALLY RUNS, not just "code that exists".

## 1. Plan in phases (sequential, don't cram it into one shot)
1. **Backend first**: data store + API + seed data + backend test.
2. **Frontend next**: UI that calls the working API.
3. **Final check**: start the server + curl the home page and the API.

## 2. Anti-hang / anti-break rules (IMPORTANT)
- **SPLIT INTO SMALL FILES < ~180 lines each.** Don't generate one giant JS/HTML file in a single shot — it tends to exceed the token cap and hang. e.g. frontend: split `core.js`, `auth.js`, `<each-view>.js`, `main.js` instead of one 700-line `app.js`.
- **Test data MUST be isolated.** Tests must not overwrite the real data file (e.g. `data.json`). Use a separate file for tests (e.g. `data.test.json` via an env var) OR re-seed after tests. Don't let tests destroy demo data.
- **Serve static correctly**: route `/` MUST return `index.html` (don't 404 by mapping it to a directory). Check: `curl localhost:PORT/` returns 200.
- Edit existing files with edit_file, don't rewrite whole files.

## 3. Self-verify before reporting done
- Backend: run `node --test` (or the relevant test) until it PASSES.
- Frontend: `node --check` each JS file.
- Real boot: run the server on a port, `curl /` and `curl one main API endpoint` → correct status. Stop the server after.
- **SAFE shutdown**: save the PID (`PORT=4599 node server.mjs & PID=$!`) then `kill "$PID"`. NEVER `pkill -f node`/`pkill -f server`/`lsof -ti:PORT|xargs kill` — broad patterns kill the harness itself (its cmdline also contains "node"/"server"). Use an uncommon test port (e.g. 4599) to avoid clearing old processes.
- If the system-provided verify command reports FAIL: read the output carefully, fix the real cause, don't guess.

## 4. UI criteria (if there's a frontend)
- Clear layout (sidebar/topbar for a dashboard), consistent palette, rounded corners, subtle shadow, status badges.
- Format numbers/money per locale.
- All user-facing text in the language the user asked for.

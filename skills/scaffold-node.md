---
name: scaffold-node
description: Quickly scaffold a small Node.js project/script that runs immediately, nothing extra.
---

When the user wants a new Node project/script:

1. Create the minimal structure: `package.json` (type:module, scripts.start), an entry file (e.g. `index.mjs`).
2. Do NOT install dependencies unless truly needed (prefer Node built-ins).
3. If deps are needed: `bash` → `npm init -y` then `npm install <pkg>`.
4. Write clear, runnable code: `node index.mjs`.
5. Run it with `bash` to prove it works, paste the output for the user.
6. Summarize how to run it.

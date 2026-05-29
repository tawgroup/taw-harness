---
name: security
description: Catch the common security mistakes before shipping — secrets, injection, authz, deps.
---

Quick security pass on code you write or review:

1. **No hardcoded secrets**: keys/tokens/passwords come from env or a secrets store, never committed. `grep` the diff for `sk-`, `AKIA`, `password=`, `-----BEGIN`.
2. **Injection**: parameterize SQL; never build shell commands from unsanitized input; avoid `eval`. Escape/encode output rendered into HTML (XSS).
3. **AuthN/AuthZ**: every non-public endpoint checks identity AND that the user owns/may access the resource (no IDOR). Return 401/403 correctly.
4. **Validate & limit input**: type/length/range checks; cap request body size; rate-limit auth and write endpoints.
5. **Secrets in transit/at rest**: HTTPS; hash passwords (bcrypt/argon2), never store plaintext.
6. **Deps**: avoid abandoned/typo-squat packages; run an audit if available.
7. Report findings by severity; fix the P0s before shipping.

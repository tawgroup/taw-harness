---
name: docker
description: Containerize an app with a small, correct Dockerfile and verify it builds and runs.
---

When containerizing an app:

1. **Small base image**: `node:20-alpine`, `python:3.12-slim`, etc. Avoid full/`latest`.
2. **Layer caching**: copy manifest first (`package.json` / `requirements.txt`), install deps, THEN copy source — so code changes don't bust the dep layer.
3. **`.dockerignore`**: exclude node_modules, .git, .env, build artifacts, caches.
4. **Runtime**: `EXPOSE` the port, set `ENV`, run as non-root where possible, use exec-form `CMD ["..."]`.
5. **No secrets in the image**: pass them at runtime via env, never `COPY` a `.env`.
6. **Multi-stage** when there's a build step: build in one stage, copy only artifacts into a slim final stage.
7. **Verify**: `docker build -t app .` then `docker run --rm -p ...` and curl it. Paste the result.

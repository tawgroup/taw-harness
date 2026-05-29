---
name: api-design
description: Design clean REST/JSON APIs — predictable routes, status codes, validation, errors.
---

When building or extending an HTTP API:

1. **Resource-oriented routes**: `GET/POST /things`, `GET/PUT/DELETE /things/:id`. Verbs only for actions that aren't CRUD (`POST /things/:id/confirm`).
2. **Correct status codes**: 200 ok, 201 created, 204 no content, 400 bad input, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation, 500 server error.
3. **Validate every input** at the boundary; return `{ "error": "..." }` (consistent shape) with a 4xx. Never trust client data.
4. **Auth**: protect non-public routes (token/header check) and return 401 when missing/invalid. Verify with a no-token request.
5. **Consistency**: same JSON envelope, same date format (ISO 8601), same pagination style across endpoints.
6. **Verify**: curl each endpoint (happy + error + unauthorized) and confirm status + body.

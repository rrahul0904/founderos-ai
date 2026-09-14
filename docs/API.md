# API

All project APIs are organization-scoped. In `AUTH_MODE=shared-key`, authenticate with the `founderos_session` HTTP-only cookie or `Authorization: Bearer <FOUNDEROS_API_KEY>`.

## Projects
- `GET /api/projects`
- `POST /api/projects` — `{ "idea": "..." }`
- `POST /api/projects/:id/run` — `{ "agent": "validation|product|architecture|learning" }`

## Evidence intelligence
- `GET /api/projects/:id/evidence`
- `POST /api/projects/:id/evidence`
- `GET /api/projects/:id/claims`
- `POST /api/projects/:id/claims`
- `POST /api/projects/:id/research` — `{ "url":"https://..." }` or `{ "query":"..." }`
- `GET /api/projects/:id/jobs`

## Build execution
- `GET /api/projects/:id/build` — list durable build plans.
- `POST /api/projects/:id/build` — create a draft plan from `{ "repository":"owner/name", "objective":"optional", "baseBranch":"main" }`.
- `POST /api/projects/:id/build/:planId/approve` — explicit human approval gate.
- `POST /api/projects/:id/build/:planId/publish` — verify the allowlisted repository, create/resume the dedicated branch, and create/reuse implementation issues.
- `GET /api/projects/:id/build/:planId/work-order` — return the portable Markdown work order.

GitHub publication requires server-side `GITHUB_TOKEN` plus `FOUNDEROS_GITHUB_ALLOWED_REPOS`. The API reports missing credentials/permissions as a blocked plan rather than success.

## Governance
- `GET /api/projects/:id/budget`
- `PUT /api/projects/:id/budget`
- `GET /api/projects/:id/audit`

## Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Health
- `GET /api/health`

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

## Governance
- `GET /api/projects/:id/budget`
- `PUT /api/projects/:id/budget`
- `GET /api/projects/:id/audit`

## Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Health
- `GET /api/health`

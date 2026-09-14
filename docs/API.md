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
- `POST /api/projects/:id/research`
- `GET /api/projects/:id/jobs`

## Build execution
- `GET /api/projects/:id/build`
- `POST /api/projects/:id/build`
- `POST /api/projects/:id/build/:planId/approve`
- `POST /api/projects/:id/build/:planId/publish`
- `POST /api/projects/:id/build/:planId/execute`
- `GET /api/projects/:id/build/:planId/execute`
- `POST /api/projects/:id/build/:planId/pull-request`
- `GET /api/projects/:id/build/:planId/work-order`

## Preview verification
- `POST /api/projects/:id/build/:planId/preview` — body `{ "teamId":"team_...", "projectId":"prj_..." }`; discovers only a non-production Vercel deployment whose Git SHA and branch exactly match the verified FounderOS execution, then queues browser verification when `READY`.
- `GET /api/projects/:id/build/:planId/preview` — reads durable browser-verification status and synchronizes the browser report into the build plan.

`VERCEL_TOKEN` stays server-side. Vercel team/project IDs are explicit non-secret build-target configuration. Browser verification requires `DATABASE_URL` and the separate preview worker.

## Governance
- `GET /api/projects/:id/budget`
- `PUT /api/projects/:id/budget`
- `GET /api/projects/:id/audit`

## Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`

## Health
- `GET /api/health`

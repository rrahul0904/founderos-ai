# API

## `GET /api/health`
Returns service health.

## `GET /api/projects`
Lists projects in the current development repository.

## `POST /api/projects`

```json
{ "idea": "A sufficiently detailed product idea..." }
```

Creates a project brain at lifecycle stage `idea`.

## `POST /api/projects/:id/run`

```json
{ "agent": "validation" }
```

Allowed agents: `validation`, `product`, `architecture`, `learning`.

The zero-config runtime uses deterministic local outputs. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY` to enable the hosted provider adapter.

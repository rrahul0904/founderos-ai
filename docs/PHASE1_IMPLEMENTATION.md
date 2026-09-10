# Phase 1 implementation status

## Implemented

- Organization-scoped project repository and API boundary.
- PostgreSQL is used automatically when `DATABASE_URL` is configured; zero-config development keeps an in-memory repository.
- Shared-key production authentication mode with HTTP-only session cookie; development auth is blocked in production unless explicitly opted in.
- Evidence CRUD with source type, URL, confidence, excerpt and SHA-256 provenance hash.
- Source capture jobs with retry/lease/idempotency handling.
- URL validation, DNS/private-address blocking, redirect re-validation, content-type filtering and source-size limits.
- Optional Tavily-backed research search jobs.
- Source snapshots stored separately from evidence claims.
- Claim/evidence graph (`claims` + `claim_evidence`) and claim API.
- Agent grounding from captured evidence; full excerpts are not injected into prompts by default.
- Agent run persistence with model/provider, latency, tokens and cost telemetry.
- Daily/per-run AI budgets and budget API.
- Audit events for project, evidence, claims, research, budgets and agent runs.
- Idempotent Phase 1 database migration for existing installations.

## External configuration still required

- `TAVILY_API_KEY` is required only for autonomous web-search jobs. URL capture and manual evidence work without it.
- `OPENAI_API_KEY` is required only when `AI_PROVIDER=openai`. Deterministic local agents remain available without paid credentials.
- Accurate OpenAI cost enforcement requires setting the per-million-token pricing environment variables for the chosen model.
- Production should enforce outbound network policy/egress proxy in addition to application-level SSRF checks.

## Deliberately not claimed complete

Full multi-user signup/SSO/RBAC is not part of this slice. Phase 1 has organization scoping plus a shared-key deployment mode; enterprise identity remains a follow-on.

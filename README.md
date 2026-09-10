# FounderOS AI

FounderOS is an evidence-first AI product operating system: **idea → evidence → decision → spec → architecture → build → deploy → learn**.

It is an independent product inspired by the general context-continuity problem visible in tools such as Falbor; it does not copy Falbor source code, branding, or proprietary assets.

## Phase 1 capabilities

- durable project brain with organization scoping
- evidence records, source snapshots and SHA-256 provenance
- claim ↔ evidence graph
- manual evidence, URL capture and optional web search
- durable research worker with leases/retries/idempotency
- SSRF-oriented URL safety controls
- evidence-grounded validation/product/architecture/learning agents
- local deterministic AI mode plus optional OpenAI provider
- provider/model/token/latency/cost run telemetry
- daily and per-run AI budgets
- audit events
- PostgreSQL persistence with an in-memory zero-config development fallback
- shared-key production auth option
- Docker, migration scripts and CI

## Quick start without paid services

```bash
cp .env.example .env.local
npm install
npm run dev
```

With `DATABASE_URL` blank, the web UI uses in-memory development storage. Manual evidence and local deterministic agents work immediately.

## Enable durable PostgreSQL + research worker

```bash
docker compose up -d postgres
export DATABASE_URL=postgres://founderos:founderos@localhost:5432/founderos
npm run dev
npm run dev:worker
```

For an existing Phase 0 database:

```bash
npm run migrate
```

`TAVILY_API_KEY` enables search-query research jobs. It is not required for manual evidence or direct URL capture. `OPENAI_API_KEY` is optional; set `AI_PROVIDER=openai` only when you want hosted model runs.

## Production auth

```bash
AUTH_MODE=shared-key
FOUNDEROS_API_KEY='replace-with-a-long-random-secret'
```

The browser login page stores the key in an HTTP-only session cookie. Multi-user SSO/RBAC is intentionally not represented as complete yet.

## Verify

```bash
npm run verify
```

See `docs/PHASE1_IMPLEMENTATION.md` for the exact implemented/pending boundary.

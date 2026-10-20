# FounderOS AI

FounderOS is an evidence-first AI product operating system: **idea → evidence → decision → spec → architecture → build → deploy → learn**.

It is an independent product inspired by the general context-continuity problem visible in tools such as Falbor; it does not copy Falbor source code, branding, or proprietary assets.

## Current capabilities

### Phase 1 — evidence intelligence

- durable project brain with organization scoping
- evidence records, source snapshots and SHA-256 provenance
- claim ↔ evidence graph
- manual evidence, URL capture and optional web search
- durable research worker with leases/retries/idempotency
- evidence-grounded validation/product/architecture/learning agents
- provider/model/token/latency/cost run telemetry and AI budgets
- PostgreSQL persistence, audit events, and shared-key production auth option

### Phase 2 — guarded build delivery

- persistent build plans generated from the project brain
- explicit human approval before external GitHub writes
- server-side GitHub adapter with deny-by-default repository allowlist
- dedicated `founderos/*` branch creation; no direct-base-branch delivery
- resumable implementation-issue publication
- portable Markdown work orders for coding agents/operators
- blocked-state reporting for missing credentials, permissions, or repository configuration

Sandboxed coding execution, generated commits/PRs, preview deployments, and browser release verification are intentionally not represented as complete yet. See `docs/PHASE2_IMPLEMENTATION.md`.

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

`TAVILY_API_KEY` enables search-query research jobs. `OPENAI_API_KEY` is optional; set `AI_PROVIDER=openai` only when you want hosted model runs.

## Enable guarded GitHub publication

Use a fine-grained token restricted to the repositories FounderOS may manage:

```bash
GITHUB_TOKEN='replace-with-server-side-token'
FOUNDEROS_GITHUB_ALLOWED_REPOS='owner/repository,owner/another-repository'
```

FounderOS will refuse publication outside the allowlist and requires a plan approval before branch/issue creation.

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

See `docs/PHASE1_IMPLEMENTATION.md` and `docs/PHASE2_IMPLEMENTATION.md` for the exact implemented/pending boundaries.

## Founder Intelligence (REA 2026-10-20 extension)

Within an existing project, visit `/projects/<project-id>/intelligence` or select **Founder intelligence** in the project header. The extension supports an explicitly approved company profile, redacted customer interview signals linked to evidence IDs, dated founder-controlled pivot gates, grounded deterministic daily actions and six export-only specialist drafts. The saved profile is persisted in the project brain; in PostgreSQL mode the signal and state revision are committed together under a row lock.

Do not enter confidential raw transcripts without appropriate customer consent. Default local mode is an in-memory prototype; production requires configured authentication and PostgreSQL. Nothing automatically contacts prospects or executes business decisions. This feature is not a complete AtomAI clone or production-ready multitenant release; see [REA source mapping, verification and hardening gates](docs/REA_ATOMAI_20261020.md).

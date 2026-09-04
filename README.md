# FounderOS AI

FounderOS is an evidence-first AI product operating system inspired by the strongest idea behind tools such as Falbor: keep one durable project context from **idea → evidence → decision → build → deploy → learn**.

This repository is an independent implementation. It does not copy Falbor source code, branding, or proprietary assets.

## What works in Phase 0

- Create a product project from a raw idea.
- Maintain a structured project memory and lifecycle state.
- Run four specialized agents: Validation, Product, Architecture, and Growth/Learning.
- Work without paid API keys using a deterministic mock provider.
- Expose REST endpoints for projects and agent runs.
- Persist through an abstraction designed for PostgreSQL, with an in-memory runtime fallback for zero-config local use.
- Ship a PostgreSQL schema for projects, evidence, decisions, runs, events, and durable jobs.
- Include a worker scaffold, health checks, Docker, Compose, CI, tests, and deployment documentation.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

For PostgreSQL:

```bash
docker compose up -d postgres
```

The initial UI still operates without a database; PostgreSQL wiring is deliberately isolated behind `@founderos/db` so the next phase can switch repositories without rewriting product logic.

## Verify

```bash
npm run verify
```

## Repository map

```text
apps/web             Next.js product workspace + APIs
apps/worker          durable-job worker scaffold
packages/core        domain types, lifecycle, project memory
packages/agents      specialized AI agents + provider abstraction
packages/db          persistence contracts + PostgreSQL adapter foundation
packages/observability telemetry/event primitives
infra/postgres       canonical relational schema
docs                 product, architecture, API, security, roadmap
```

## Product principle

The system should not blindly build whatever a user types. It should collect evidence, make uncertainty visible, preserve product decisions, and use post-deployment signals to drive the next iteration.

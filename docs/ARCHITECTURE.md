# Technical architecture

## Design principles

- Evidence and provenance before autonomous action.
- One canonical project context, many specialized agents.
- Provider-neutral AI runtime.
- Web request path stays fast; long research/build work moves to durable jobs.
- PostgreSQL is the transactional source of truth.
- Portable runtime: Vercel for web is optional, containers/Kubernetes are first-class.

## Logical architecture

```text
Browser
  |
Next.js Workspace
  |-- Project API
  |-- Evidence API
  |-- Decision API
  |-- Agent Run API
  |
Agent Orchestrator -------- Model Providers
  |
Durable Job Queue ---------- Worker Pool
  |                            |-- Browser research executor
  |                            |-- Build executor (future)
  |                            `-- Deployment adapters (future)
  |
PostgreSQL
  |-- projects
  |-- evidence
  |-- decisions
  |-- agent_runs
  |-- jobs
  `-- product_events

Object storage (future): source snapshots, generated artifacts, screenshots
Analytics warehouse (future): high-volume telemetry only
```

## Agent contract

Every run must have a project ID, explicit objective, bounded tool permissions, provider/model metadata, structured output, latency/cost telemetry, and provenance links for claims derived from external sources.

## Evidence intelligence

External web content is untrusted data. Research workers should normalize a source into `{url, captured_at, excerpt, claim, confidence, hash}`. The LLM may summarize evidence but cannot silently upgrade an unsupported claim into a fact.

## Context intelligence

Context is assembled per task rather than dumping the entire project into every prompt. The context builder ranks: approved decisions, current lifecycle stage, relevant evidence, recent runs, unresolved assumptions, and requested artifacts.

## Scale path

Phase 0 uses a JSON project payload for development speed. Phase 1 normalizes hot entities while retaining an aggregate snapshot. Product telemetry can later move to ClickHouse/BigQuery without turning FounderOS into a second copy of customers' application databases.

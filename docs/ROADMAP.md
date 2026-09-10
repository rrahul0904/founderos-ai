# Roadmap

## Phase 0 — foundation ✅

- product brain/domain model
- usable web workspace
- validation/product/architecture/learning agents
- provider abstraction with no-key local mode
- REST endpoints
- PostgreSQL canonical schema
- durable worker scaffold
- Docker + CI + tests

## Phase 1 — evidence intelligence — substantially implemented

- ✅ organization-scoped data boundary
- ✅ shared-key production authentication mode
- ✅ PostgreSQL repository in the web request path
- ✅ evidence/source APIs
- ✅ URL capture worker with retries and SSRF controls
- ✅ optional web-search adapter (Tavily)
- ✅ source snapshots + provenance hashes
- ✅ claim/evidence graph and confidence scoring
- ✅ daily and per-run budget enforcement
- ✅ full agent-run persistence and audit events
- ⏳ full multi-user signup/SSO/RBAC
- ⏳ production egress proxy/network policy

## Phase 2 — build execution
- GitHub repository connection
- implementation-plan-to-issue generation
- sandboxed coding agent executor
- branch/PR workflow instead of direct-main writes
- preview deployment adapters
- automated tests and release evidence

## Phase 3 — production learning loop
- client telemetry SDK
- errors, funnels, feedback and billing signals
- experiment registry
- learning agent proposes evidence-backed next actions
- production incident → context → diagnosis → guarded fix PR

## Phase 4 — platform
- MCP/tool registry
- reusable agent skills
- enterprise SSO/RBAC/governance and policy engine
- marketplace for adapters and workflows

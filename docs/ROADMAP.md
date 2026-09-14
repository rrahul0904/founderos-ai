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
- ✅ evidence/source APIs and URL/search research worker
- ✅ source snapshots + provenance hashes
- ✅ claim/evidence graph and confidence scoring
- ✅ daily/per-run budget enforcement and audit events
- ⏳ full multi-user signup/SSO/RBAC
- ⏳ production egress proxy/network policy

## Phase 2 — build execution — guarded Node executor implemented
- ✅ GitHub repository connection with server-side token + deny-by-default allowlist
- ✅ implementation-plan-to-task/issue generation
- ✅ human approval before GitHub writes
- ✅ dedicated branch creation and resumable issue publication
- ✅ durable build execution queue separate from research jobs
- ✅ opt-in Node.js coding worker with constrained model patch protocol
- ✅ container sandbox verification before commit/push
- ✅ draft pull-request open/reuse after verified branch code exists
- ⏳ additional language/package-manager executors
- ⏳ production microVM/remote-sandbox isolation
- ⏳ signed release-evidence manifests
- ⏳ preview deployment adapters + browser verification

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

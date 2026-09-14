# Security model

## Implemented controls

1. Organization ID is enforced in project/evidence/job/budget/audit repository queries.
2. Production can use `AUTH_MODE=shared-key`; dev auth refuses production unless `ALLOW_DEV_AUTH=true` is explicitly set.
3. Provider/API secrets remain server-side.
4. Research URL capture accepts only HTTP(S), rejects local/private destinations after DNS resolution, validates each redirect, limits content type, source size, redirect count and request time.
5. Captured sources receive SHA-256 hashes and source snapshots.
6. Full retrieved page bodies are not automatically injected into agent prompts; agents receive normalized claim summaries and source URLs.
7. Research jobs use leases, retries, attempt caps and idempotency keys.
8. Agent spend has daily/per-run controls and run-level usage/cost telemetry.
9. Privileged product/research/build actions emit audit events in PostgreSQL mode.
10. GitHub delivery keeps the token server-side and denies repositories outside `FOUNDEROS_GITHUB_ALLOWED_REPOS` unless an explicit development escape hatch is enabled.
11. External GitHub writes require an approved build plan and target a dedicated `founderos/*` branch rather than the base branch.
12. Branch and issue publication is designed to resume after partial failure instead of intentionally duplicating work.

## Production hardening still required

- Put research workers behind an outbound proxy/network policy to close DNS-rebinding/egress edge cases at the infrastructure layer.
- Replace shared-key auth with SSO or multi-user credential/OIDC authentication before collaborative public SaaS use.
- Use a managed secrets service for GitHub/model/provider credentials.
- Sandboxed code execution is not yet implemented. Phase 2 currently stops at an approved branch, implementation issues, and portable work order; generated code must not execute in the web process.

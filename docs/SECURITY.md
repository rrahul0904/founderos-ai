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
9. Privileged product/research actions emit audit events.

## Production hardening still required

- Put workers behind an outbound proxy/network policy to close DNS-rebinding/egress edge cases at the infrastructure layer.
- Replace shared-key auth with SSO or multi-user credential/OIDC authentication before collaborative public SaaS use.
- Use a managed secrets service.
- Sandboxed code execution remains a Phase 2 requirement.
